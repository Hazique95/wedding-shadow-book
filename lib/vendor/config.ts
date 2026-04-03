import type { UploadProvider } from "@/lib/vendor/types";

export function getUploadProvider(): UploadProvider {
  return process.env.NEXT_PUBLIC_VENDOR_UPLOAD_PROVIDER === "cloudinary"
    ? "cloudinary"
    : "supabase";
}
