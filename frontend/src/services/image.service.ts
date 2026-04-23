/**
 * Image Service
 *
 * Handles image uploading directly to the backend endpoint.
 */

import api from "./api";
import { MAX_IMAGE_SIZE_BYTES, ACCEPTED_IMAGE_TYPES } from "../config/images";

export type ImageContext = "avatar" | "shop" | "profile";

export interface UploadResult {
  /** CDN / local URL ready to display */
  url: string;
  /** Basename to store in the database */
  filename: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Throws a descriptive error if the file is invalid. */
export function validateImageFile(file: File): void {
  const accepted = ACCEPTED_IMAGE_TYPES.split(",");
  if (!accepted.includes(file.type)) {
    throw new Error(
      `Unsupported file type "${file.type}". Please upload a JPEG, PNG, or WebP image.`
    );
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(`File is too large (${mb} MB). Maximum allowed size is 5 MB.`);
  }
}

// ─── Upload flow ──────────────────────────────────────────────────────────────

/**
 * High-level upload function used by all components.
 *
 * Usage:
 *   const result = await imageService.uploadImage(file, "shop", shopId);
 *   // result.url  → display immediately
 *   // result.filename → persist to DB via shop update API
 */
async function uploadImage(
  file: File,
  context: ImageContext,
  entityId?: string | number
): Promise<UploadResult> {
  validateImageFile(file);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("context", context);
  if (entityId) {
    formData.append("entity_id", String(entityId));
  }

  try {
    const response = await api.post("/api/v1/images/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    
    return {
      url: response.data.url,
      filename: response.data.filename,
    };
  } catch (err: any) {
    console.error("[imageService] Failed to upload image:", err);
    throw new Error(err.response?.data?.detail || "Could not upload image to server. Please try again.");
  }
}

export const imageService = {
  uploadImage,
  validateImageFile,
};
