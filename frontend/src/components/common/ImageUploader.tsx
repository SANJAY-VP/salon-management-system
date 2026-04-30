/**
 * ImageUploader – drop-in component for any image upload surface.
 *
 * Variants:
 *   "avatar"  – circle / rounded avatar with initials fallback
 *   "shop"    – wide landscape card image
 *   "profile" – medium rounded square
 *
 * How it works:
 *  1. Wraps useImageUpload hook.
 *  2. Renders a hidden <input type="file">.
 *  3. Shows a hover overlay to trigger the picker.
 *  4. Calls onUpload(result) so the parent can persist filename to the backend.
 *
 * Usage:
 *   <ImageUploader
 *     variant="shop"
 *     context="shop"
 *     entityId={shopId}
 *     initialUrl={shop.images}
 *     name={shop.name}
 *     onUpload={async (result) => {
 *       await shopService.updateShop(shopId, { images: result.filename });
 *     }}
 *   />
 */

import { useImageUpload } from "../../hooks/useImageUpload";
import { imageService, ImageContext, UploadResult } from "../../services/image.service";
import { ACCEPTED_IMAGE_TYPES } from "../../config/images";
import { Icon } from "./Icon";
import { Avatar, AppImage } from "./AppImage";

export interface ImageUploaderProps {
  /** Visual style */
  variant?: "avatar" | "shop" | "profile";
  /** Image context for upload service */
  context: ImageContext;
  /** Entity ID passed to the upload URL request */
  entityId?: string | number;
  /** Current stored image URL (already resolved – may be CDN or local) */
  initialUrl?: string | null;
  /** Name used for initials fallback in avatar variant */
  name?: string;
  /** Called after successful upload; persist result.filename to DB here */
  onUpload?: (result: UploadResult) => void | Promise<void>;
  className?: string;
  /** Disable the upload interaction */
  disabled?: boolean;
}

export default function ImageUploader({
  variant = "avatar",
  context,
  entityId,
  initialUrl,
  name,
  onUpload,
  className = "",
  disabled = false,
}: ImageUploaderProps) {
  const { previewUrl, isUploading, inputRef, openPicker, handleFileChange } =
    useImageUpload({ context, entityId, onUpload, initialUrl });

  const isClickable = !disabled && !isUploading;

  if (variant === "avatar") {
    const initials = name
      ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
      : "?";
      
    // Use AppImage's fallback mechanism if there's an entityId
    const fallbackSrc = entityId
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${entityId}`
      : undefined;

    return (
      <div
        className={`relative group inline-block overflow-hidden flex-shrink-0 bg-white/5 ring-2 ring-gold/20 group-hover:ring-gold/50 transition-all duration-300 ${isClickable ? "cursor-pointer" : "cursor-default"} ${className || 'w-28 h-28 rounded-[24px]'}`}
        onClick={isClickable ? openPicker : undefined}
        title={isClickable ? "Click to change photo" : undefined}
      >
        {previewUrl ? (
          <AppImage
            src={previewUrl}
            fallback={fallbackSrc}
            alt={name || "Avatar"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gold/10 flex items-center justify-center font-black text-gold text-3xl">
            {initials}
          </div>
        )}

        {/* Hover overlay */}
        {isClickable && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
            <Icon icon="camera" size={20} className="text-gold" />
            <span className="text-[9px] font-black text-gold uppercase tracking-widest mt-1">
              Change
            </span>
          </div>
        )}

        {/* Loading spinner */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        )}

        <HiddenInput inputRef={inputRef} onChange={handleFileChange} />
      </div>
    );
  }

  // ── Shop / Hero variant ───────────────────────────────────────────────────
  if (variant === "shop") {
    return (
      <div
        className={`relative group overflow-hidden rounded-[32px] ${isClickable ? "cursor-pointer" : ""} ${className}`}
        onClick={isClickable ? openPicker : undefined}
        title={isClickable ? "Click to change shop image" : undefined}
      >
        <img
          src={previewUrl ?? "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80"}
          alt={name ?? "Shop"}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {isClickable && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gold/20 border border-gold/40 flex items-center justify-center">
              <Icon icon="camera" size={24} className="text-gold" />
            </div>
          </div>
        )}

        {isUploading && <UploadingOverlay />}

        <HiddenInput inputRef={inputRef} onChange={handleFileChange} />
      </div>
    );
  }

  // ── Profile variant ───────────────────────────────────────────────────────
  return (
    <div
      className={`relative group rounded-[20px] overflow-hidden ${isClickable ? "cursor-pointer" : ""} ${className}`}
      onClick={isClickable ? openPicker : undefined}
      title={isClickable ? "Click to change profile image" : undefined}
    >
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={name ?? "Profile"}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gold/10 text-gold font-black text-3xl">
          {name?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
      )}

      {isClickable && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Icon icon="camera" size={20} className="text-gold" />
        </div>
      )}

      {isUploading && <UploadingOverlay />}

      <HiddenInput inputRef={inputRef} onChange={handleFileChange} />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function HiddenInput({
  inputRef,
  onChange,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPTED_IMAGE_TYPES}
      className="hidden"
      onChange={onChange}
    />
  );
}

function UploadingOverlay() {
  return (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      <span className="text-[9px] font-black text-gold uppercase tracking-widest">
        Uploading…
      </span>
    </div>
  );
}
