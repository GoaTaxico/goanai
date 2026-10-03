import type { FileUIPart } from "ai";

import { MAX_IMAGE_CHARS } from "@/lib/limits";

export async function compressPhoto(file: File): Promise<FileUIPart | null> {
  if (!file.type.startsWith("image/") || file.size > 8_000_000) return null;

  try {
    const bitmap = await createImageBitmap(file);
    const maxEdge = 1280;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return null;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const url = canvas.toDataURL("image/jpeg", 0.72);
    if (!url.startsWith("data:image/jpeg;base64,") || url.length > MAX_IMAGE_CHARS) return null;
    return { type: "file", mediaType: "image/jpeg", filename: "photo.jpg", url };
  } catch {
    return null;
  }
}
