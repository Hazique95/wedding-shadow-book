import { createClient } from "@/lib/supabase/client";
import { getUploadProvider } from "@/lib/vendor/config";

async function uploadToCloudinary(file: File) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary is enabled but NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is missing.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Cloudinary upload failed.");
  }

  const data = await response.json();
  return data.secure_url as string;
}

async function uploadToSupabase(file: File, userId: string) {
  const supabase = createClient();
  const path = `${userId}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const { error } = await supabase.storage.from("vendor-media").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("vendor-media").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadVendorImage(file: File, userId: string) {
  return getUploadProvider() === "cloudinary"
    ? uploadToCloudinary(file)
    : uploadToSupabase(file, userId);
}
