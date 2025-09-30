const express = require('express');
const router = express.Router();

const {
    createTWReview, 
    getAllTWReviews,
    deleteTWReview
} = require('../controllers/twReview-controller');

router.post('/', createTWReview);
router.get('/', getAllTWReviews);
router.delete('/', deleteTWReview);

module.exports = router;