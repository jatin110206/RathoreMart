const Product = require('../model/product');
const cloudinary = require('../config/cloudnary');

// ─── CREATE PRODUCT (Admin only) ────────────────────────────────────────────
const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock } = req.body;

        // Upload images to Cloudinary if provided
        let images = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'khareedlo/products'
                });
                images.push({
                    public_id: result.public_id,
                    url: result.secure_url
                });
            }
        }

        const product = await Product.create({
            name,
            description,
            price,
            category,
            stock,
            images,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── GET ALL PRODUCTS (Public) ───────────────────────────────────────────────
const getAllProducts = async (req, res) => {
    try {
        const { keyword, category, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

        const filter = {};

        // Keyword search on name
        if (keyword) {
            filter.name = { $regex: keyword, $options: 'i' };
        }

        // Category filter
        if (category) {
            filter.category = category;
        }

        // Price range filter
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [products, total] = await Promise.all([
            Product.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
            Product.countDocuments(filter)
        ]);

        res.json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            products
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── GET SINGLE PRODUCT (Public) ────────────────────────────────────────────
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({ success: true, product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── UPDATE PRODUCT (Admin only) ────────────────────────────────────────────
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const { name, description, price, category, stock } = req.body;

        // Upload new images to Cloudinary if provided
        if (req.files && req.files.length > 0) {
            // Delete old images from Cloudinary
            for (const img of product.images) {
                await cloudinary.uploader.destroy(img.public_id);
            }

            let newImages = [];
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'khareedlo/products'
                });
                newImages.push({
                    public_id: result.public_id,
                    url: result.secure_url
                });
            }
            product.images = newImages;
        }

        product.name        = name        || product.name;
        product.description = description || product.description;
        product.price       = price       ?? product.price;
        product.category    = category    || product.category;
        product.stock       = stock       ?? product.stock;

        const updatedProduct = await product.save();

        res.json({ success: true, product: updatedProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── DELETE PRODUCT (Admin only) ────────────────────────────────────────────
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Delete all images from Cloudinary
        for (const img of product.images) {
            await cloudinary.uploader.destroy(img.public_id);
        }

        await product.deleteOne();

        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── ADD / UPDATE REVIEW (Logged in users) ───────────────────────────────────
const addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if user has already reviewed
        const alreadyReviewed = product.reviews.find(
            (r) => r.user.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
            // Update existing review
            alreadyReviewed.rating  = Number(rating);
            alreadyReviewed.comment = comment;
        } else {
            // Add new review
            product.reviews.push({
                user:    req.user._id,
                name:    req.user.name,
                rating:  Number(rating),
                comment
            });
            product.numReviews = product.reviews.length;
        }

        // Recalculate average rating
        product.rating =
            product.reviews.reduce((acc, r) => acc + r.rating, 0) /
            product.reviews.length;

        await product.save();

        res.status(201).json({ success: true, message: 'Review added' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ─── DELETE REVIEW (Owner or Admin) ─────────────────────────────────────────
const deleteReview = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const reviewIndex = product.reviews.findIndex(
            (r) => r._id.toString() === req.params.reviewId
        );

        if (reviewIndex === -1) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Only the review author or admin can delete
        const isOwner = product.reviews[reviewIndex].user.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        product.reviews.splice(reviewIndex, 1);
        product.numReviews = product.reviews.length;
        product.rating =
            product.reviews.length > 0
                ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
                : 0;

        await product.save();

        res.json({ success: true, message: 'Review deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    addReview,
    deleteReview
};
