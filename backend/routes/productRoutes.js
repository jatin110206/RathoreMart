const express = require('express');
const router  = express.Router();
const multer  = require('multer');

const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    addReview,
    deleteReview
} = require('../controlers/productControler');

const { protect } = require('../middleware/authMiddleware');
const { admin }   = require('../middleware/adminMiddleware');

// Multer — store files temporarily before uploading to Cloudinary
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, '/tmp'),
    filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// ─── Public Routes ───────────────────────────────────────────────────────────
router.get('/',    getAllProducts);
router.get('/:id', getProductById);

// ─── Protected Routes (logged-in users) ─────────────────────────────────────
router.post('/:id/reviews',             protect, addReview);
router.delete('/:id/reviews/:reviewId', protect, deleteReview);

// ─── Admin Routes ────────────────────────────────────────────────────────────
router.post('/',     protect, admin, upload.array('images', 5), createProduct);
router.put('/:id',   protect, admin, upload.array('images', 5), updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
