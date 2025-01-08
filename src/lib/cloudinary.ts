import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(base64String: string) {
  try {
    // Extract MIME type and base64 data
    const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    
    if (!matches) {
      throw new Error('Invalid base64 string format');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const isPDF = mimeType.includes('pdf');

    console.log('Uploading file:', { mimeType, isPDF });

    const uploadOptions: { 
      folder: string; 
      resource_type: "raw" | "image" | "auto" | "video";
      format?: string;
    } = {
      folder: 'vehicle-scrap',
      resource_type: isPDF ? "raw" : "image",
      format: isPDF ? 'pdf' : undefined,
    };

    const result = await cloudinary.uploader.upload(
      `data:${mimeType};base64,${base64Data}`,
      uploadOptions
    );

    if (!result || !result.secure_url) {
      throw new Error('Upload failed - no URL returned');
    }

    console.log('Upload successful:', {
      type: isPDF ? 'PDF' : 'Image',
      url: result.secure_url,
      resourceType: uploadOptions.resource_type
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
} 