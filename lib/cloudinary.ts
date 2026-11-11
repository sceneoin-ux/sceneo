// SceneO Cloudinary Media Upload Adapter
// Free Tier: 25 GB Bandwidth / 25k transformations / month
// Delivers lightweight auto-WebP / AVIF flyers (< 250KB)

export interface CloudinaryUploadResponse {
  success: boolean;
  secureUrl?: string;
  publicId?: string;
  error?: string;
}

/**
 * Upload an image file directly to Cloudinary using an unsigned upload preset
 */
export async function uploadFlyerToCloudinary(file: File): Promise<CloudinaryUploadResponse> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // Fallback simulator if Cloudinary is not yet configured
  if (!cloudName || !uploadPreset || cloudName === "demo_cloud") {
    console.log("[Cloudinary Simulator] Uploading local preview in mock mode");
    // Return a mock or object URL for instant UI preview
    const objectUrl = URL.createObjectURL(file);
    return {
      success: true,
      secureUrl: objectUrl,
      publicId: `sim_${Date.now()}`
    };
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "sceneo_event_flyers");

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "Failed to upload image to Cloudinary");
    }

    // Automatically apply Cloudinary optimization tags: f_auto (WebP/AVIF), q_auto (intelligent compression)
    const optimizedUrl = data.secure_url.replace(
      "/upload/",
      "/upload/f_auto,q_auto,w_1200,c_limit/"
    );

    return {
      success: true,
      secureUrl: optimizedUrl,
      publicId: data.public_id
    };
  } catch (err) {
    console.error("[Cloudinary Upload Error]:", err);
    return {
      success: false,
      error: (err as Error).message
    };
  }
}
