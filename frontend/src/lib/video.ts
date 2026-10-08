/**
 * Turn an external video link into something we can embed.
 * Returns null for unsupported hosts (the caller shows the raw URL instead).
 */
export function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const videoId = u.searchParams.get("v") || u.pathname.slice(1);
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Vimeo
    if (u.hostname.includes("vimeo.com")) {
      const videoId = u.pathname.split("/").pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }
    // Instagram - use embed endpoint
    if (u.hostname.includes("instagram.com")) {
      return `${url}/embed/`;
    }
    // Facebook
    if (u.hostname.includes("facebook.com") || u.hostname.includes("fb.watch")) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
    }
    return null;
  } catch {
    return null;
  }
}
