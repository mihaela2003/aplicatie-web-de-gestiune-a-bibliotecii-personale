// routes/bookGenre-routes.js
const express = require('express');
const router = express.Router();
const {
    createBookGenre,
    getAllBookGenres,
    getBookGenreById,
    updateBookGenre,
    deleteBookGenre
} = require('../controllers/bookGenre-controller');

// Create a new book-genre relationship
router.post('/bookgenres', createBookGenre);

// Get all book-genre relationships
router.get('/bookgenres', getAllBookGenres);

// Get a single book-genre relationship by ID
router.get('/bookgenres/:id', getBookGenreById);

// Update a book-genre relationship
router.put('/bookgenres/:id', updateBookGenre);

// Delete a book-genre relationship
router.delete('/bookgenres/:id', deleteBookGenre);

module.exports = router;