const ImageKit = require('imagekit');

let imagekitInstance = null;

const getImageKit = () => {
  if (imagekitInstance) return imagekitInstance;

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/qbwmuvvwo';

  if (!publicKey || !privateKey) {
    console.warn('⚠️ ImageKit credentials not fully provided in .env');
    return null;
  }

  imagekitInstance = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });

  return imagekitInstance;
};

/**
 * Get client-side upload authentication parameters (token, expire, signature)
 */
const getAuthenticationParameters = () => {
  const ik = getImageKit();
  if (!ik) return null;
  return ik.getAuthenticationParameters();
};

/**
 * Upload an image or document (PDF, docx, etc.) to ImageKit
 * ImageKit accepts files, images, PDFs and raw binary data up to allowed limits
 */
const uploadToImageKit = async (fileBufferOrBase64, fileName, folder = '/skyhaven_vault') => {
  const ik = getImageKit();
  if (!ik) {
    throw new Error('ImageKit is not initialized. Check your credentials.');
  }

  const result = await ik.upload({
    file: fileBufferOrBase64,
    fileName,
    folder,
    useUniqueFileName: true,
  });

  return {
    fileId: result.fileId,
    name: result.name,
    url: result.url,
    thumbnailUrl: result.thumbnailUrl || result.url,
    previewUrl: result.url,
    size: result.size,
    provider: 'imagekit',
  };
};

/**
 * Delete file from ImageKit by fileId
 */
const deleteFromImageKit = async (fileId) => {
  const ik = getImageKit();
  if (!ik) return;
  await ik.deleteFile(fileId);
};

module.exports = {
  getImageKit,
  getAuthenticationParameters,
  uploadToImageKit,
  uploadImage: uploadToImageKit,
  deleteFromImageKit,
  deleteImage: deleteFromImageKit,
};
