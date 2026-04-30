/**
 * App-wide loading indicator — circular spinner only (no pulse/skeleton text).
 */
export function LoadingSpinner({
  className = "",
  size = "md",
  label = "Loading",
  /** Inline ring only (no flex wrapper) — use inside buttons or status banners */
  inline = false,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Announced to screen readers */
  label?: string;
  inline?: boolean;
}) {
  const sizeClass =
    size === "sm"
      ? "w-8 h-8 border-2"
      : size === "lg"
        ? "w-16 h-16 border-[3px]"
        : "w-12 h-12 border-2";

  const ring = (
    <div
      className={`${sizeClass} border-gold/20 border-t-gold rounded-full animate-spin ${inline ? className : ""}`}
      aria-hidden
    />
  );

  if (inline) {
    return (
      <span className="inline-flex items-center" role="status" aria-busy="true" aria-label={label}>
        <span className="sr-only">{label}</span>
        {ring}
      </span>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      {ring}
    </div>
  );
}
