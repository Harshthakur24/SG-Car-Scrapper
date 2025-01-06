import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Add type for Cloudinary response
type CloudinaryResponse = { secure_url: string };

export async function uploadToCloudinary(base64String: string): Promise<string> {
  try {
    // Check if it's a PDF/DOC or image
    const isPDF = base64String.includes('application/pdf');
    const isDoc = base64String.includes('application/msword') || 
                 base64String.includes('application/vnd.openxmlformats-officedocument');

    const uploadOptions = {
      resource_type: (isPDF || isDoc ? 'raw' : 'auto') as 'raw' | 'auto',
      folder: 'vehicle-scrap',
      format: isPDF ? 'pdf' : isDoc ? 'doc' : 'auto'
    } as const;

    // Upload to Cloudinary
    const result = await new Promise<CloudinaryResponse>((resolve, reject) => {
      cloudinary.uploader.upload(
        base64String,
        uploadOptions,
        (error, result) => {
          if (error) reject(error);
          else resolve(result as CloudinaryResponse);
        }
      );
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file');
  }
} 