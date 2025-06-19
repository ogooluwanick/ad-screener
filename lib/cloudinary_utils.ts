import cloudinary from './cloudinary';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  format?: string;
  resource_type?: string;
  created_at?: string;
  bytes?: number;
}

/**
 * Uploads a file to Cloudinary.
 * @param fileBuffer The buffer of the file to upload.
 * @param folder The folder in Cloudinary to upload the file to.
 * @param fileName The name to give the uploaded file.
 * @returns Promise resolving to the upload result or null if failed.
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string,
  fileName: string,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto' // Added resourceType parameter
): Promise<CloudinaryUploadResult | null> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: fileName,
        resource_type: resourceType, // Use the passed resourceType
      },
      (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            resource_type: result.resource_type,
            created_at: result.created_at,
            bytes: result.bytes,
          });
        } else {
          // Should not happen if error is not present
          reject(new Error('Cloudinary upload failed without error or result.'));
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
}

/**
 * Deletes a file from Cloudinary.
 * @param publicId The public ID of the file to delete.
 * @param resourceType The type of resource (e.g., 'image', 'video', 'raw'). Defaults to 'image'.
 * @returns Promise resolving to true if successful, false otherwise.
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    // result.result will be 'ok' on success, or 'not found' etc.
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

/**
 * Deletes an ad file (image or video) from Cloudinary.
 * @param publicId The public ID of the ad file to delete.
 * @returns Promise resolving to true if successful, false otherwise.
 */
export async function deleteAdFileFromCloudinary(publicId: string): Promise<boolean> {
  try {
    // First try deleting as an image
    let result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    if (result.result === 'ok') {
      return true;
    }
    // If not found or failed, try deleting as a video
    result = await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary ad file delete error:', error);
    return false;
  }
}
