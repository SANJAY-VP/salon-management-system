/// <reference types="vite/client" />
/**
 * Centralized Image Configuration
 *
 * LOCAL_STORAGE_BASE  – simulates CDN during local development.
 *                       Replace with CDN_BASE_URL when the backend is ready.
 *
 * CDN_BASE_URL        – future AWS CloudFront / S3 CDN endpoint.
 *                       Will be injected via environment variable.
 *
 * HOW TO SWITCH TO PRODUCTION:
 *   1. Set VITE_CDN_BASE_URL in your .env file.
 *   2. The MEDIA_BASE constant automatically picks it up – no other code changes needed.
 */

import { API_BASE_URL } from "../config";

/** Local dev storage – served from FastAPI backend uploads dir */
const LOCAL_STORAGE_BASE = `${API_BASE_URL}/uploads`;

/** Production CDN URL (set VITE_CDN_BASE_URL in .env) */
const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL || "";

/** Active base URL – CDN in prod, local /public/storage in dev */
export const MEDIA_BASE = CDN_BASE_URL || LOCAL_STORAGE_BASE;

/** Sub-paths inside storage / CDN */
export const IMAGE_PATHS = {
  avatars: "avatars",
  shops: "shops",
  profiles: "profiles",
} as const;

/** Fallback images shown when no image is stored yet */
export const FALLBACK_IMAGES = {
  shop: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80",
  shopHero:
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=2074",
  avatar: "https://i.pravatar.cc/150",
  profile: "https://i.pravatar.cc/200",
} as const;

/** Accepted MIME types for file pickers */
export const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/jpg,image/png,image/webp";

/** Maximum upload size in bytes (5 MB) */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Build the full URL for a stored image.
 * Returns the fallback when `filename` is empty / undefined.
 *
 * Examples:
 *   getImageUrl("shops", "shop-42.jpg")   → "/storage/shops/shop-42.jpg"
 *   getImageUrl("avatars", null, fallback) → fallback
 */
export function getImageUrl(
  folder: keyof typeof IMAGE_PATHS,
  filename?: string | null,
  fallback?: string
): string {
  if (!filename) return fallback ?? FALLBACK_IMAGES.shop;
  // If already an absolute URL (http/https / data URI), return as-is
  if (/^(https?:\/\/|data:)/.test(filename)) return filename;
  return `${MEDIA_BASE}/${IMAGE_PATHS[folder]}/${filename}`;
}

/**
 * Build the shop image URL from any raw value the backend might return
 * (absolute URL, bare filename, or null/undefined).
 */
export function resolveShopImage(
  rawValue?: string | null,
  hero = false
): string {
  return getImageUrl("shops", rawValue, hero ? FALLBACK_IMAGES.shopHero : FALLBACK_IMAGES.shop);
}

/** Resolve an avatar / user profile image URL. */
export function resolveAvatarImage(
  rawValue?: string | null,
  seed?: string | number
): string {
  if (!rawValue) {
    return seed
      ? `${FALLBACK_IMAGES.avatar}?u=${seed}`
      : FALLBACK_IMAGES.avatar;
  }
  return getImageUrl("avatars", rawValue, FALLBACK_IMAGES.avatar);
}
