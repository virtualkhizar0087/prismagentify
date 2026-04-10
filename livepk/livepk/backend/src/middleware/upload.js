/**
 * LivePK — Cloudinary Upload Middleware
 * Handles image uploads for products, avatars, store logos, stream thumbnails
 */

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ── Configure Cloudinary ──
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ── Allowed MIME types ──
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

// ── Storage: Product Images ──
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'livepk/products',
    allowed_formats: ALLOWED_FORMATS,
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
  }
});

// ── Storage: Avatars ──
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'livepk/avatars',
    allowed_formats: ALLOWED_FORMATS,
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }]
  }
});

// ── Storage: Store Assets (logos, banners) ──
const storeStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isLogo = file.fieldname === 'storeLogo';
    return {
      folder: 'livepk/stores',
      allowed_formats: ALLOWED_FORMATS,
      transformation: isLogo
        ? [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }]
        : [{ width: 1200, height: 400, crop: 'fill', quality: 'auto' }]
    };
  }
});

// ── Storage: Stream Thumbnails ──
const streamStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'livepk/streams',
    allowed_formats: ALLOWED_FORMATS,
    transformation: [{ width: 1280, height: 720, crop: 'fill', quality: 'auto' }]
  }
});

// ── File size limits ──
const limits = { fileSize: 10 * 1024 * 1024 }; // 10MB

// ── Multer instances ──
exports.uploadProductImages = multer({ storage: productStorage, limits }).array('images', 10);
exports.uploadAvatar        = multer({ storage: avatarStorage, limits }).single('avatar');
exports.uploadStoreAssets   = multer({ storage: storeStorage, limits }).fields([
  { name: 'storeLogo', maxCount: 1 },
  { name: 'storeBanner', maxCount: 1 }
]);
exports.uploadStreamThumbnail = multer({ storage: streamStorage, limits }).single('thumbnail');

// ── Helper: Delete image from Cloudinary ──
exports.deleteImage = async (publicIdOrUrl) => {
  try {
    let publicId = publicIdOrUrl;
    // Extract public_id from URL if full URL passed
    if (publicIdOrUrl.startsWith('http')) {
      const parts = publicIdOrUrl.split('/');
      const file = parts[parts.length - 1].split('.')[0];
      const folder = parts[parts.length - 2];
      publicId = `livepk/${folder}/${file}`;
    }
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err);
  }
};

// ── Helper: Get optimized URL ──
exports.getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    ...options
  });
};

exports.cloudinary = cloudinary;
