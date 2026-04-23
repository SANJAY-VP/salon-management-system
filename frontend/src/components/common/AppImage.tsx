/**
 * AppImage – smart image component with fallback support.
 *
 * Wraps <img> with:
 *  – Automatic fallback on error (via onError)
 *  – Optional loading skeleton
 *  – Accepts all standard img props
 *
 * Usage:
 *   <AppImage src={shop.images} fallback={FALLBACK_IMAGES.shop} alt="My Shop" className="..." />
 */

import { useState, ImgHTMLAttributes } from "react";
import { FALLBACK_IMAGES } from "../../config/images";

interface AppImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Fallback URL shown when src fails to load */
  fallback?: string;
  /** Show a shimmer skeleton while the image is loading */
  showSkeleton?: boolean;
}

export function AppImage({
  src,
  fallback = FALLBACK_IMAGES.shop,
  showSkeleton = false,
  className = "",
  alt = "",
  ...rest
}: AppImageProps) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src || fallback);
  const [loaded, setLoaded] = useState(false);

  const handleError = () => setImgSrc(fallback);
  const handleLoad = () => setLoaded(true);

  return (
    <span className="relative block overflow-hidden" style={{ display: "contents" }}>
      {showSkeleton && !loaded && (
        <span
          aria-hidden="true"
          className={`absolute inset-0 bg-white/5 animate-pulse rounded-inherit ${className}`}
        />
      )}
      <img
        {...rest}
        src={imgSrc}
        alt={alt}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
      />
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

interface AvatarProps {
  /** Image URL or null/undefined for initials fallback */
  src?: string | null;
  /** Name used to generate initials when no image is available */
  name?: string;
  /** Unique seed for pravatar fallback */
  seed?: string | number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  alt?: string;
}

const AVATAR_SIZES = {
  xs: "w-8 h-8 text-xs rounded-xl",
  sm: "w-10 h-10 text-sm rounded-xl",
  md: "w-14 h-14 text-base rounded-2xl",
  lg: "w-20 h-20 text-xl rounded-2xl",
  xl: "w-28 h-28 text-3xl rounded-[24px]",
};

export function Avatar({
  src,
  name,
  seed,
  size = "md",
  className = "",
  alt,
}: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const fallback = seed
    ? `${FALLBACK_IMAGES.avatar}?u=${seed}`
    : FALLBACK_IMAGES.avatar;

  const sizeClass = AVATAR_SIZES[size];

  if (!src) {
    return (
      <div
        className={`${sizeClass} bg-gold/10 border border-gold/20 flex items-center justify-center font-black text-gold flex-shrink-0 ${className}`}
        aria-label={alt ?? name ?? "Avatar"}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} overflow-hidden flex-shrink-0 bg-white/5 ${className}`}
    >
      <AppImage
        src={src}
        fallback={fallback}
        alt={alt ?? name ?? "Avatar"}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

// ─── ShopImage ─────────────────────────────────────────────────────────────────

interface ShopImageProps {
  /** Raw value from backend (URL, filename, or null) */
  src?: string | null;
  alt?: string;
  className?: string;
  /** Use the hero-style fallback (landscape) */
  hero?: boolean;
}

export function ShopImage({ src, alt = "Salon", className = "", hero = false }: ShopImageProps) {
  const fallback = hero ? FALLBACK_IMAGES.shopHero : FALLBACK_IMAGES.shop;
  return (
    <AppImage
      src={src ?? fallback}
      fallback={fallback}
      alt={alt}
      className={className}
      showSkeleton
    />
  );
}
