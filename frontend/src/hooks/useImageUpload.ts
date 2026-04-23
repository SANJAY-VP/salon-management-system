/**
 * useImageUpload – reusable hook for handling image selection & upload.
 *
 * Features:
 *  – File validation (type + size) via imageService
 *  – Instant local preview via object URL
 *  – Pluggable onUpload callback so each component decides what to do with the result
 *  – Loading & error state management
 *  – Cleans up object URLs to prevent memory leaks
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { imageService, ImageContext, UploadResult } from "../services/image.service";
import toast from "react-hot-toast";

export interface UseImageUploadOptions {
  /** Context used for upload URL generation (shop | avatar | profile) */
  context: ImageContext;
  /** Entity ID sent to the backend (shopId, userId…). Can be set later. */
  entityId?: string | number;
  /** Called with the upload result after a successful upload */
  onUpload?: (result: UploadResult) => void | Promise<void>;
  /** Initial image URL to display before any upload */
  initialUrl?: string | null;
}

export interface UseImageUploadReturn {
  /** URL to display in <img src={...}> — either the initial URL or the object URL of the new pick */
  previewUrl: string | null;
  /** Whether an upload is in progress */
  isUploading: boolean;
  /** Hidden file input ref — attach to <input type="file" ref={inputRef} /> */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Call this to open the file picker programmatically */
  openPicker: () => void;
  /** Attach this to onChange of the hidden <input type="file"> */
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  /** Manually trigger upload with a given File (if you manage file picking yourself) */
  uploadFile: (file: File) => Promise<void>;
  /** Clear current preview */
  clearPreview: () => void;
}

export function useImageUpload({
  context,
  entityId,
  onUpload,
  initialUrl,
}: UseImageUploadOptions): UseImageUploadReturn {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Track object URLs we created so we can revoke them on cleanup
  const objectUrlRef = useRef<string | null>(null);

  // Sync initial URL if it changes externally
  useEffect(() => {
    setPreviewUrl(initialUrl ?? null);
  }, [initialUrl]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      try {
        // Validate first (throws on error)
        imageService.validateImageFile(file);

        // Show instant local preview
        const localUrl = URL.createObjectURL(file);
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = localUrl;
        setPreviewUrl(localUrl);

        setIsUploading(true);
        const result = await imageService.uploadImage(file, context, entityId);

        // Replace object URL with final CDN URL (or keep local if mock)
        if (result.url !== localUrl) {
          setPreviewUrl(result.url);
          URL.revokeObjectURL(localUrl);
          objectUrlRef.current = null;
        }

        await onUpload?.(result);
        toast.success("Image uploaded successfully!");
      } catch (err: any) {
        toast.error(err?.message || "Image upload failed.");
      } finally {
        setIsUploading(false);
      }
    },
    [context, entityId, onUpload]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await uploadFile(file);
      // Reset so the same file can be re-selected later
      if (inputRef.current) inputRef.current.value = "";
    },
    [uploadFile]
  );

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const clearPreview = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreviewUrl(initialUrl ?? null);
  }, [initialUrl]);

  return {
    previewUrl,
    isUploading,
    inputRef,
    openPicker,
    handleFileChange,
    uploadFile,
    clearPreview,
  };
}
