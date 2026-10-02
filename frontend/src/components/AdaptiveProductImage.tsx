import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  foregroundClassName?: string;
};

/**
 * Universal image with matching background.
 *
 * Instead of white / grey letterbox bars when the photo aspect ratio
 * doesn't match the container, we reuse the SAME image as a blurred,
 * scaled-up backdrop. Works for any image — no per-image color needed.
 */
export default function AdaptiveProductImage({
  src,
  alt,
  sizes,
  priority = false,
  foregroundClassName = "",
}: Props) {
  return (
    <>
      {/* Matching background — same image, blurred to fill empty space */}
      <span aria-hidden className="absolute inset-0 overflow-hidden">
        <Image
          src={src}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          className="scale-110 object-cover blur-2xl saturate-[1.4] brightness-[0.95]"
        />
        {/* Soft veil so foreground stays readable in light/dark mode */}
        <span className="absolute inset-0 bg-white/20 dark:bg-black/30" />
      </span>
      {/* Full photo, never cropped */}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`z-10 object-contain ${foregroundClassName}`}
      />
    </>
  );
}
