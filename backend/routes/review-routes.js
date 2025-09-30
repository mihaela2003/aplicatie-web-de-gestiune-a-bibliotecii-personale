const express = require('express');
const router = express.Router();

const {
    createReview,
    getAllReviews,
    getReviewById,
    updateReview,
    deleteReview,
    createOrUpdateReview,
    getReviewByBookAndUser,
    getReviewStats
} = require('../controllers/review-controller');

router.post('/basic', createReview);
router.get('/', getAllReviews);
router.get('/:id', getReviewById);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/', createOrUpdateReview);
router.get('/book/:bookId/user/:userId', getReviewByBookAndUser);
router.get('/stats/:bookId', getReviewStats);

module.exports = router;