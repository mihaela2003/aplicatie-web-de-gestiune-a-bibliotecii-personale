// routes/readingStatus-routes.js
const express = require('express');
const router = express.Router();
const {
    createReadingStatus,
    getAllReadingStatuses,
    getReadingStatusById,
    updateReadingStatus,
    deleteReadingStatus,
    getReadingStatusByBookAndUser,
    getUserReadingStatuses,
    updateStartDate,
    updateFinishDate,
    updatePageCounter,
    updatePages
} = require('../controllers/readingStatus-controller');

// Create a new reading status
router.post('/', createReadingStatus);

// Get all reading statuses
router.get('/', getAllReadingStatuses);

// Get a single reading status by ID
router.get('/:id', getReadingStatusById);

// Update a reading status
router.put('/:id', updateReadingStatus);

// Delete a reading status
router.delete('/:id', deleteReadingStatus);

// Ruta nouă pentru căutare după book_id și user_id
router.get('/by-book-user/:user_id/:book_id',getReadingStatusByBookAndUser);

router.get('/user/:userId', getUserReadingStatuses);

// Update routes for specific fields
router.put('/:id/start-date', updateStartDate);
router.put('/:id/finish-date', updateFinishDate);
router.put('/:id/page-counter', updatePageCounter);
router.put('/:id/pages', updatePages);

module.exports = router;