/**
 * In-browser video compression.
 *
 * Plays the clip through a canvas capped at 720p and re-records it with
 * MediaRecorder, which usually shrinks phone-recorded MP4s to a fraction
 * of their original size. Nothing leaves the device until the caller
 * uploads the returned file.
 */

const MAX_WIDTH = 1280;
const MAX_HEIGHT = 720;
const TARGET_FPS = 30;

export type CompressProgress = (progress: number) => void;

/** Containers the current browser can actually record. */
function pickMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

function loadMetadata(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Could not read this video."));
  });
}

/** Resolves once playback finishes (some files never fire `ended`). */
function waitForEnd(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    const done = () => resolve();
    video.onended = done;
    const check = () => {
      if (
        video.ended ||
        (Number.isFinite(video.duration) && video.currentTime >= video.duration - 0.05)
      ) {
        done();
        return;
      }
      setTimeout(check, 250);
    };
    setTimeout(check, 250);
  });
}

export async function compressVideo(
  file: File,
  onProgress?: CompressProgress,
): Promise<File> {
  const mimeType = pickMimeType();
  if (!mimeType) throw new Error("Video compression is not supported here.");

  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.playsInline = true;
  video.preload = "auto";

  let stream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let recorder: MediaRecorder | null = null;
  let frame = 0;

  try {
    await loadMetadata(video);

    // Some recorded WebM files report an infinite duration — they can't be
    // progress-tracked or reliably stopped, so refuse instead of hanging.
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      throw new Error("This video could not be compressed.");
    }

    const scale = Math.min(
      1,
      MAX_WIDTH / video.videoWidth,
      MAX_HEIGHT / video.videoHeight,
    );
    const width = Math.max(2, Math.round((video.videoWidth * scale) / 2) * 2);
    const height = Math.max(2, Math.round((video.videoHeight * scale) / 2) * 2);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");

    stream = canvas.captureStream(TARGET_FPS);

    // Route the soundtrack through Web Audio: the captured track is silent
    // for the user (nothing is connected to the speakers) but still lands
    // in the re-encoded file.
    try {
      audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(video);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      const track = destination.stream.getAudioTracks()[0];
      if (track) stream.addTrack(track);
      await audioContext.resume().catch(() => {});
    } catch {
      // No audio track / Web Audio unavailable — carry on without sound.
    }

    const instance = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: width >= 1000 ? 2_500_000 : 1_200_000,
      audioBitsPerSecond: 96_000,
    });
    recorder = instance;
    const chunks: BlobPart[] = [];
    instance.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    const finished = new Promise<void>((resolve, reject) => {
      instance.onstop = () => resolve();
      instance.onerror = () => reject(new Error("Could not compress this video."));
    });

    instance.start(250);
    const draw = () => {
      context.drawImage(video, 0, 0, width, height);
      onProgress?.(Math.min(1, video.currentTime / video.duration));
      frame = requestAnimationFrame(draw);
    };
    draw();

    await video.play();
    await waitForEnd(video);

    cancelAnimationFrame(frame);
    frame = 0;
    // Let the encoder flush the final frames before stopping.
    await new Promise((resolve) => setTimeout(resolve, 300));
    instance.stop();
    await finished;

    const blob = new Blob(chunks, { type: mimeType.split(";")[0] });
    if (blob.size === 0) throw new Error("Compressed video came out empty.");

    const extension = mimeType.startsWith("video/mp4") ? "mp4" : "webm";
    const base = file.name.replace(/\.[^.]+$/, "") || "video";
    return new File([blob], `${base}-compressed.${extension}`, {
      type: blob.type,
      lastModified: Date.now(),
    });
  } finally {
    if (frame) cancelAnimationFrame(frame);
    video.pause();
    stream?.getTracks().forEach((track) => track.stop());
    if (recorder && recorder.state !== "inactive") recorder.stop();
    await audioContext?.close().catch(() => {});
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
