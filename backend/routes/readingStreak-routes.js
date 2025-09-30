const express = require('express');
const router = express.Router();

const {
    updateStreak,
    getStreak
} = require('../controllers/readingStreak-controller');

router.post('/:userId', updateStreak);
router.get('/:userId', getStreak);

module.exports = router;