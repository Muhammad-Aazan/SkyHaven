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

/**
 * =========================================================================
 * CASCADING MULTI-TIER UPLOAD ENGINE (ImageKit -> Cloudinary -> Supabase)
 * =========================================================================
 * 1. Pehle Tier 1 (ImageKit) try karega
 * 2. Agar ImageKit limit exceed ho ya error aaye, Tier 2 (Cloudinary) pe switch karega
 * 3. Agar Cloudinary bhi limit exceed kare, Tier 3 (Supabase) pe switch karega
 */
const uploadWithCascadingFallback = async (fileBufferOrBase64, fileName, mimeType, userId) => {
  const errors = [];

  // --- TIER 1: ImageKit ---
  try {
    console.log(`[Storage Pipeline] Tier 1: Trying ImageKit for "${fileName}"...`);
    const ikRes = await uploadToImageKit(fileBufferOrBase64, fileName, `/skyhaven/${userId || 'vault'}`);
    console.log(`✅ [Storage Pipeline] Saved successfully to ImageKit: ${ikRes.url}`);
    return {
      ...ikRes,
      provider: 'imagekit',
      storageKey: ikRes.fileId || `imagekit/${fileName}`,
    };
  } catch (err1) {
    console.warn(`⚠️ [Storage Pipeline] Tier 1 (ImageKit) unavailable or limit reached: ${err1.message}`);
    errors.push({ tier: 'ImageKit', error: err1.message });
  }

  // --- TIER 2: Cloudinary ---
  try {
    console.log(`[Storage Pipeline] Tier 2: Falling back to Cloudinary for "${fileName}"...`);
    const cldRes = await uploadToCloudinary(fileBufferOrBase64, fileName, mimeType);
    console.log(`✅ [Storage Pipeline] Saved successfully to Cloudinary: ${cldRes.url}`);
    return {
      ...cldRes,
      provider: 'cloudinary',
      storageKey: cldRes.fileId || `cld/${fileName}`,
    };
  } catch (err2) {
    console.warn(`⚠️ [Storage Pipeline] Tier 2 (Cloudinary) unavailable or limit reached: ${err2.message}`);
    errors.push({ tier: 'Cloudinary', error: err2.message });
  }

  // --- TIER 3: Supabase Vault ---
  try {
    console.log(`[Storage Pipeline] Tier 3: Falling back to Supabase Vault for "${fileName}"...`);
    const storageKey = `vault/${userId || 'guest'}/${Date.now()}_${fileName.replace(/\s+/g, '_')}`;
    const buffer = Buffer.isBuffer(fileBufferOrBase64)
      ? fileBufferOrBase64
      : Buffer.from(fileBufferOrBase64.replace(/^data:.*?;base64,/, ''), 'base64');

    const sbRes = await uploadToSupabase(buffer, storageKey, mimeType);
    console.log(`✅ [Storage Pipeline] Saved successfully to Supabase: ${sbRes.url}`);
    return {
      ...sbRes,
      provider: 'supabase',
    };
  } catch (err3) {
    console.error(`❌ [Storage Pipeline] Tier 3 (Supabase) failed: ${err3.message}`);
    errors.push({ tier: 'Supabase', error: err3.message });
    throw new Error(`All 3 storage tiers failed. Errors: ${JSON.stringify(errors)}`);
  }
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
