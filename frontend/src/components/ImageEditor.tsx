"use client";

import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

import "react-easy-crop/react-easy-crop.css";

const ASPECTS = [
  { label: "Original", value: 0 },
  { label: "Square", value: 1 },
  { label: "4:3", value: 4 / 3 },
] as const;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Renders the cropped + rotated region to a JPEG file. */
async function exportCropped(
  src: string,
  crop: Area,
  rotation: number,
  fileName: string,
): Promise<File> {
  const image = await loadImage(src);
  const radians = (rotation * Math.PI) / 180;

  // Bounding box of the rotated image.
  const rotatedWidth =
    Math.abs(image.width * Math.cos(radians)) +
    Math.abs(image.height * Math.sin(radians));
  const rotatedHeight =
    Math.abs(image.width * Math.sin(radians)) +
    Math.abs(image.height * Math.cos(radians));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(crop.width);
  canvas.height = Math.round(crop.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available.");

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);
  ctx.translate(-image.width / 2, -image.height / 2);
  // react-easy-crop reports the crop box in rotated-image coordinates.
  ctx.drawImage(
    image,
    rotatedWidth / 2 - image.width / 2 - crop.x,
    rotatedHeight / 2 - image.height / 2 - crop.y,
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((result) => resolve(result), "image/jpeg", 0.92),
  );
  if (!blob) throw new Error("Could not process the image.");
  const base = fileName.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

/**
 * Crop + rotate dialog shown right after picking a photo and before
 * upload. Returns the edited file, or nothing when cancelled.
 */
export default function ImageEditor({
  src,
  fileName,
  onDone,
  onCancel,
}: {
  src: string;
  fileName: string;
  onDone: (file: File) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [aspectChoice, setAspectChoice] = useState<number>(0);
  const [naturalAspect, setNaturalAspect] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  async function handleDone() {
    if (!croppedArea) return;
    setSaving(true);
    setError(null);
    try {
      onDone(await exportCropped(src, croppedArea, rotation, fileName));
    } catch {
      setError("Could not process the image. Try again.");
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-xl backdrop:bg-slate-900/50 dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Edit photo
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Drag to crop · pinch/scroll to zoom · rotate as needed
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel editing"
          className="rounded-lg px-2 py-1 text-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          ✕
        </button>
      </div>

      <div className="relative h-72 w-full overflow-hidden rounded-xl bg-slate-900 sm:h-80">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspectChoice === 0 ? naturalAspect : aspectChoice}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={(_, area) => setCroppedArea(area)}
          onMediaLoaded={(media) =>
            setNaturalAspect(media.naturalWidth / media.naturalHeight)
          }
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setRotation((r) => r - 90)}
          aria-label="Rotate left"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ⟲ Rotate
        </button>
        <button
          type="button"
          onClick={() => setRotation((r) => r + 90)}
          aria-label="Rotate right"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Rotate ⟳
        </button>
        <div className="ml-auto flex gap-1">
          {ASPECTS.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setAspectChoice(option.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                aspectChoice === option.value
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-3 block text-xs font-medium text-slate-500 dark:text-slate-400">
        Zoom
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="mt-1 w-full accent-emerald-600"
        />
      </label>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDone}
          disabled={saving || !croppedArea}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? "Processing…" : "Use photo"}
        </button>
      </div>
    </dialog>
  );
}
