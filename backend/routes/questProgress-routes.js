const express = require('express');
const router = express.Router();

const {
    createProgress,
    getAllProgress,
    getProgress, 
    updateProgress,
    deleteProgress
} = require('../controllers/questProgress-controller');

// Create a new progress record
router.post('/:userChallengeId/progress', createProgress);

// Get all progress records for a user challenge
router.get('/:userChallengeId/progress', getAllProgress);

// Get a specific progress record
router.get('/:userChallengeId/progress/:progressId', getProgress);

// Update a progress record
router.put('/:userChallengeId/progress/:progressId', updateProgress);

// Delete a progress record
router.delete('/:userChallengeId/progress/:progressId', deleteProgress);

module.exports = router;