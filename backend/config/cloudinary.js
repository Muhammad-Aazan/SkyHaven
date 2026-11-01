const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'j8vmxsbn',
  api_key: process.env.CLOUDINARY_API_KEY || '764596847846811',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'eaWVd8ToL7acypxm-UMpkisvLas',
  secure: true,
});

/**
 * Upload buffer or base64 or stream to Cloudinary
 * Handles raw files (PDFs, docs, zips) as well as images/videos
 */
const uploadToCloudinary = async (fileBufferOrBase64, fileName, mimeType) => {
  const isImage = mimeType?.startsWith('image/');
  const isVideo = mimeType?.startsWith('video/');
  const resourceType = isImage ? 'image' : isVideo ? 'video' : 'raw';

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: 'skyhaven_vault',
      public_id: fileName ? fileName.replace(/\.[^/.]+$/, '') + '_' + Date.now() : undefined,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
    };

    if (Buffer.isBuffer(fileBufferOrBase64)) {
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(error);
        resolve({
          fileId: result.public_id,
          name: result.original_filename || fileName,
          url: result.secure_url,
          previewUrl: isImage ? result.secure_url : null,
          thumbnailUrl: isImage ? cloudinary.url(result.public_id, { width: 200, height: 200, crop: 'fill' }) : null,
          size: result.bytes,
          format: result.format,
          provider: 'cloudinary',
        });
      });
      uploadStream.end(fileBufferOrBase64);
    } else {
      // Base64 string or remote URL
      cloudinary.uploader.upload(fileBufferOrBase64, uploadOptions)
        .then(result => {
          resolve({
            fileId: result.public_id,
            name: result.original_filename || fileName,
            url: result.secure_url,
            previewUrl: isImage ? result.secure_url : null,
            thumbnailUrl: isImage ? cloudinary.url(result.public_id, { width: 200, height: 200, crop: 'fill' }) : null,
            size: result.bytes,
            format: result.format,
            provider: 'cloudinary',
          });
        })
        .catch(reject);
    }
  });
};

/**
 * Delete file from Cloudinary
 */
const deleteFromCloudinary = async (publicId, resourceType = 'raw') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.warn('[Cloudinary Delete Error]:', err.message);
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
};
