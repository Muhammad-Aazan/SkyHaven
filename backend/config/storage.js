const { createClient } = require('@supabase/supabase-js');
const { uploadToImageKit, deleteFromImageKit } = require('./imagekit');
const { uploadToCloudinary, deleteFromCloudinary } = require('./cloudinary');

let supabaseClient = null;

const getSupabase = () => {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (url && key) {
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false },
    });
    return supabaseClient;
  }

  return null;
};

const BUCKET = () => process.env.SUPABASE_BUCKET_NAME || 'skyhaven-vault';

/**
 * Upload file buffer directly to Supabase storage
 */
const uploadToSupabase = async (fileBuffer, storageKey, mimeType) => {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase.storage
    .from(BUCKET())
    .upload(storageKey, fileBuffer, {
      contentType: mimeType || 'application/octet-stream',
      upsert: true,
    });

  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from(BUCKET())
    .getPublicUrl(storageKey);

  return {
    fileId: storageKey,
    name: storageKey.split('/').pop(),
    url: publicData?.publicUrl,
    previewUrl: publicData?.publicUrl,
    thumbnailUrl: null,
    size: fileBuffer.length,
    provider: 'supabase',
    storageKey,
  };
};

const withTimeout = (promise, ms, label) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms))
  ]);
};

/**
 * =========================================================================
 * CASCADING MULTI-TIER UPLOAD ENGINE (ImageKit -> Cloudinary -> Supabase)
 * =========================================================================
 * Fast timeout on each tier ensures instant fallback with zero stalling
 */
const uploadWithCascadingFallback = async (fileBufferOrBase64, fileName, mimeType, userId) => {
  const errors = [];
  const isImage = mimeType?.startsWith('image/');

  // If it's an image, ImageKit gives instant CDN previews & transformations
  if (isImage) {
    try {
      console.log(`[Storage Pipeline] Tier 1: Trying ImageKit for "${fileName}"...`);
      const ikRes = await withTimeout(
        uploadToImageKit(fileBufferOrBase64, fileName, `/skyhaven/${userId || 'vault'}`),
        6000,
        'ImageKit upload'
      );
      console.log(`✅ [Storage Pipeline] Saved successfully to ImageKit: ${ikRes.url}`);
      return {
        ...ikRes,
        provider: 'imagekit',
        storageKey: ikRes.fileId || `imagekit/${fileName}`,
      };
    } catch (err1) {
      console.warn(`⚠️ [Storage Pipeline] Tier 1 (ImageKit) fallback: ${err1.message}`);
      errors.push({ tier: 'ImageKit', error: err1.message });
    }

    try {
      console.log(`[Storage Pipeline] Tier 2: Falling back to Cloudinary for "${fileName}"...`);
      const cldRes = await withTimeout(
        uploadToCloudinary(fileBufferOrBase64, fileName, mimeType),
        8000,
        'Cloudinary upload'
      );
      console.log(`✅ [Storage Pipeline] Saved successfully to Cloudinary: ${cldRes.url}`);
      return {
        ...cldRes,
        provider: 'cloudinary',
        storageKey: cldRes.fileId || `cld/${fileName}`,
      };
    } catch (err2) {
      console.warn(`⚠️ [Storage Pipeline] Tier 2 (Cloudinary) fallback: ${err2.message}`);
      errors.push({ tier: 'Cloudinary', error: err2.message });
    }
  }

  // --- TIER 3 / PRIMARY FOR DOCUMENTS & GENERAL FILES: Supabase Vault ---
  try {
    console.log(`[Storage Pipeline] Uploading to Supabase Vault for "${fileName}"...`);
    const storageKey = `vault/${userId || 'guest'}/${Date.now()}_${fileName.replace(/\s+/g, '_')}`;
    const buffer = Buffer.isBuffer(fileBufferOrBase64)
      ? fileBufferOrBase64
      : Buffer.from(fileBufferOrBase64.replace(/^data:.*?;base64,/, ''), 'base64');

    const sbRes = await withTimeout(
      uploadToSupabase(buffer, storageKey, mimeType),
      12000,
      'Supabase upload'
    );
    console.log(`✅ [Storage Pipeline] Saved successfully to Supabase: ${sbRes.url}`);
    return {
      ...sbRes,
      provider: 'supabase',
    };
  } catch (err3) {
    console.error(`❌ [Storage Pipeline] Supabase failed: ${err3.message}`);
    errors.push({ tier: 'Supabase', error: err3.message });
  }

  // Final fallback if non-image fell through and hasn't tried ImageKit/Cloudinary yet
  if (!isImage) {
    try {
      console.log(`[Storage Pipeline] Final fallback: Trying ImageKit raw for "${fileName}"...`);
      const ikRes = await withTimeout(
        uploadToImageKit(fileBufferOrBase64, fileName, `/skyhaven/${userId || 'vault'}`),
        8000,
        'ImageKit raw'
      );
      return {
        ...ikRes,
        provider: 'imagekit',
        storageKey: ikRes.fileId || `imagekit/${fileName}`,
      };
    } catch (err4) {
      errors.push({ tier: 'ImageKit-Raw', error: err4.message });
    }
  }

  throw new Error(`All storage tiers failed. Errors: ${JSON.stringify(errors)}`);
};

/**
 * Universal delete router based on provider
 */
const deleteFileByProvider = async (storageKey, provider = 'supabase', mimeType = '') => {
  if (provider === 'imagekit') {
    return deleteFromImageKit(storageKey);
  } else if (provider === 'cloudinary') {
    const isImage = mimeType.startsWith('image/');
    const isVideo = mimeType.startsWith('video/');
    const resType = isImage ? 'image' : isVideo ? 'video' : 'raw';
    return deleteFromCloudinary(storageKey, resType);
  } else {
    // Supabase
    const supabase = getSupabase();
    if (supabase) {
      await supabase.storage.from(BUCKET()).remove([storageKey]);
    }
  }
};

/**
 * Generate download/preview URL
 */
const getDownloadSignedUrl = async (storageKey, expiresIn = 3600) => {
  // If storageKey is a direct URL (ImageKit or Cloudinary)
  if (storageKey?.startsWith('http://') || storageKey?.startsWith('https://')) {
    return storageKey;
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: publicData } = supabase.storage
        .from(BUCKET())
        .getPublicUrl(storageKey);

      if (publicData?.publicUrl) return publicData.publicUrl;

      const { data, error } = await supabase.storage
        .from(BUCKET())
        .createSignedUrl(storageKey, expiresIn);

      if (!error && data?.signedUrl) return data.signedUrl;
    } catch (err) {
      console.warn('⚠️ Supabase URL error:', err.message);
    }
  }

  return `https://ik.imagekit.io/qbwmuvvwo/${storageKey}`;
};

module.exports = {
  getSupabase,
  uploadWithCascadingFallback,
  uploadToSupabase,
  deleteFileByProvider,
  getDownloadSignedUrl,
  BUCKET,
};
