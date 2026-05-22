const Product = require('../models/Product');
const logger = require('../utils/logger');
const { getImageUrls, deleteImageFromCloudinary } = require('../middleware/upload');

// Get all products with filters
exports.getAllProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, page = 1, limit = 10 } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    logger.info('Products retrieved', { count: products.length, total, query });
    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    logger.error('Get all products error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      logger.warn('Product not found', { productId: req.params.id });
      return res.status(404).json({ message: 'Product not found' });
    }

    logger.info('Product retrieved', { productId: product._id });
    res.json(product);
  } catch (error) {
    logger.error('Get product error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create product with image uploads
exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, price, stock, sku, brand, tags, originalPrice } = req.body;

    if (!name || !description || !category || !price || !sku) {
      logger.warn('Create product with missing required fields');
      return res.status(400).json({ message: 'Name, description, category, price, and SKU are required' });
    }

    if (!req.file && !req.files) {
      logger.warn('Create product without images');
      return res.status(400).json({ message: 'At least a thumbnail image is required' });
    }

    // Get image URLs from Cloudinary
    const { images, thumbnail } = getImageUrls(req);

    if (!thumbnail) {
      logger.warn('Create product without thumbnail');
      return res.status(400).json({ message: 'Thumbnail image is required' });
    }

    // Check for duplicate SKU
    const existingSku = await Product.findOne({ sku });
    if (existingSku) {
      logger.warn('Duplicate SKU', { sku });
      return res.status(409).json({ message: 'SKU already exists' });
    }

    const product = new Product({
      name,
      description,
      category,
      price,
      originalPrice: originalPrice || price,
      stock: stock || 0,
      sku,
      images: images.length > 0 ? images : [thumbnail],
      thumbnail,
      brand: brand || 'Unknown',
      tags: tags ? JSON.parse(tags) : [],
    });

    await product.save();

    logger.info('Product created with images', { productId: product._id, sku, imageCount: images.length });
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    logger.error('Create product error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!product) {
      logger.warn('Product not found for update', { productId: id });
      return res.status(404).json({ message: 'Product not found' });
    }

    logger.info('Product updated', { productId: product._id });
    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    logger.error('Update product error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update product images
exports.updateProductImages = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file && !req.files) {
      logger.warn('Update product images without files');
      return res.status(400).json({ message: 'At least a thumbnail image is required' });
    }

    const product = await Product.findById(id);
    if (!product) {
      logger.warn('Product not found for image update', { productId: id });
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete old images from Cloudinary
    if (product.thumbnail && req.file) {
      await deleteImageFromCloudinary(product.thumbnail);
    }
    if (req.files && req.files.length > 0) {
      product.images.forEach(async (image) => {
        await deleteImageFromCloudinary(image);
      });
    }

    // Get new image URLs
    const { images, thumbnail } = getImageUrls(req);

    if (thumbnail) {
      product.thumbnail = thumbnail;
    }
    if (images.length > 0) {
      product.images = images;
    }

    await product.save();

    logger.info('Product images updated', { productId: product._id, imageCount: images.length });
    res.json({ message: 'Product images updated successfully', product });
  } catch (error) {
    logger.error('Update product images error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      logger.warn('Product not found for deletion', { productId: req.params.id });
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete images from Cloudinary
    if (product.thumbnail) {
      await deleteImageFromCloudinary(product.thumbnail);
    }
    product.images.forEach(async (image) => {
      await deleteImageFromCloudinary(image);
    });

    logger.info('Product deleted with images', { productId: product._id });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    logger.error('Delete product error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add review
exports.addReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { userId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      logger.warn('Invalid rating', { productId, rating });
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      logger.warn('Product not found for review', { productId });
      return res.status(404).json({ message: 'Product not found' });
    }

    product.reviews.push({ userId, rating, comment });
    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = (totalRating / product.reviews.length).toFixed(1);

    await product.save();

    logger.info('Review added', { productId, userId, rating });
    res.status(201).json({ message: 'Review added successfully', product });
  } catch (error) {
    logger.error('Add review error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      logger.warn('Search without query');
      return res.status(400).json({ message: 'Search query is required' });
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ],
      isActive: true,
    }).limit(20);

    logger.info('Products searched', { query: q, count: products.length });
    res.json({ products });
  } catch (error) {
    logger.error('Search products error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get products by category
exports.getByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const products = await Product.find({ category, isActive: true })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments({ category, isActive: true });

    logger.info('Products retrieved by category', { category, count: products.length });
    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    logger.error('Get by category error', { error: error.message });
    res.status(500).json({ message: 'Internal server error' });
  }
};
