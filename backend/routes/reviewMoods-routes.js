const express = require('express');
const router = express.Router();

const {
    createReviewMood,
    getAllReviewMoods,
    deleteReviewMood
} = require('../controllers/reviewMoods-controller');

router.post('/', createReviewMood);
router.get('/', getAllReviewMoods);
router.delete('/', deleteReviewMood);

module.exports = router;