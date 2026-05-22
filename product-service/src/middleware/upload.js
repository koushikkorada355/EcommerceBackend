const multer = require('multer');
const { upload, cloudinary } = require('../utils/cloudinary');
const logger = require('../utils/logger');

// Middleware for single image upload (thumbnail)
const uploadSingleImage = (req, res, next) => {
  upload.single('thumbnail')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      logger.error('Multer error', { error: err.message });
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      logger.error('Upload error', { error: err.message });
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Middleware for multiple image uploads (product images)
const uploadMultipleImages = (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      logger.error('Multer error for multiple images', { error: err.message });
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      logger.error('Upload error for multiple images', { error: err.message });
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Extract image URLs from uploaded files
const getImageUrls = (req) => {
  const images = [];
  let thumbnail = null;

  if (req.file) {
    thumbnail = req.file.path; // Single file (thumbnail)
  }

  if (req.files && req.files.length > 0) {
    req.files.forEach((file) => {
      images.push(file.path);
    });
  }

  return { images, thumbnail };
};

// Delete image from Cloudinary
const deleteImageFromCloudinary = async (imageUrl) => {
  try {
    // Extract public ID from Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}
    const publicId = imageUrl.split('/').pop().split('.')[0];
    const folder = process.env.CLOUDINARY_FOLDER || 'ecommerce_products';
    
    await cloudinary.uploader.destroy(`${folder}/${publicId}`);
    logger.info('Image deleted from Cloudinary', { publicId });
  } catch (error) {
    logger.error('Error deleting image from Cloudinary', { error: error.message });
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  getImageUrls,
  deleteImageFromCloudinary,
};
