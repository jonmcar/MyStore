"use server";

/**
 * Image upload server action.
 *
 * Uploads land in `public/uploads/` in the project directory. Next.js
 * serves everything under `public/` at the root URL, so a file written
 * to `public/uploads/abc123.jpg` is available at `/uploads/abc123.jpg`.
 *
 * Trade-offs of this approach:
 * - Zero external dependencies, no accounts, no credit card
 * - Works perfectly for local dev
 * - WILL NOT work on deployed serverless platforms (Vercel, etc.)
 *   because their filesystems are read-only/ephemeral. If you ever
 *   deploy, swap this module for R2/S3/UploadThing and the callers
 *   of uploadImageAction won't need to change.
 *
 * Orphan policy: when a listing or section is deleted, its uploaded
 * images become orphans on disk. That's by design for now — a
 * periodic cleanup script can scan the DB for referenced URLs and
 * remove anything in public/uploads not referenced anywhere.
 */

import { randomBytes } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function uploadImageAction(
  formData: FormData
): Promise<UploadResult> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { ok: false, error: "No file provided." };
    }

    // Validate type.
    if (!ALLOWED_TYPES.has(file.type)) {
      return {
        ok: false,
        error: `Unsupported file type: ${file.type || "unknown"}. Use JPEG, PNG, WebP, or GIF.`,
      };
    }

    // Validate size.
    if (file.size > MAX_SIZE_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      return {
        ok: false,
        error: `File too large (${mb} MB). Max size is 5 MB.`,
      };
    }
    if (file.size === 0) {
      return { ok: false, error: "File is empty." };
    }

    // Generate a random filename with the original extension.
    const ext = extensionForType(file.type);
    const filename = `${randomBytes(8).toString("hex")}${ext}`;

    // Ensure the uploads directory exists (first-run safety).
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Write the file.
    const buffer = Buffer.from(await file.arrayBuffer());
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Return the public URL — relative so it works locally and
    // anywhere the app is hosted at any path prefix.
    return { ok: true, url: `/uploads/${filename}` };
  } catch (err) {
    console.error("[uploadImageAction] failed:", err);
    return {
      ok: false,
      error: "Upload failed. Check the server logs for details.",
    };
  }
}

function extensionForType(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return "";
  }
}
