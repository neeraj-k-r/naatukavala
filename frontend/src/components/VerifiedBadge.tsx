export default function VerifiedBadge({
  size = "sm",
}: {
  size?: "sm" | "lg";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-sky-50 font-semibold text-sky-700 ${
        size === "lg" ? "px-2.5 py-1 text-xs" : "px-1.5 py-0.5 text-[10px]"
      }`}
      title="Shop identity verified"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
        className={size === "lg" ? "h-3.5 w-3.5" : "h-3 w-3"}
      >
        <path
          fillRule="evenodd"
          d="M12 1.5l2.6 1.06 2.77-.35 1.06 2.57 2.57 1.06-.35 2.77L21.7 12l-1.06 2.6.35 2.77-2.57 1.06-1.06 2.57-2.77-.35L12 21.7l-2.6-1.06-2.77.35-1.06-2.57-2.57-1.06.35-2.77L2.3 12l1.06-2.6-.35-2.77 2.57-1.06 1.06-2.57 2.77.35L12 1.5z"
          clipRule="evenodd"
          opacity="0.25"
        />
        <path
          fillRule="evenodd"
          d="M9.6 15.96L6.44 12.8a1.13 1.13 0 010-1.6 1.13 1.13 0 011.6 0l2.72 2.7 6.2-6.18a1.13 1.13 0 011.6 0 1.13 1.13 0 010 1.6l-7.36 7.35a.8.8 0 01-.57.24.8.8 0 01-.57-.25z"
          clipRule="evenodd"
        />
      </svg>
      Verified
    </span>
  );
}