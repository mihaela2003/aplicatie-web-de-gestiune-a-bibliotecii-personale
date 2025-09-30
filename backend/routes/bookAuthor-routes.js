// routes/bookAuthor-routes.js
const express = require('express');
const router = express.Router();
const {
    createBookAuthor,
    getAllBookAuthors,
    getBookAuthorById,
    updateBookAuthor,
    deleteBookAuthor
} = require('../controllers/bookAuthor-controller');

// Create a new book-author relationship
router.post('/bookauthors', createBookAuthor);

// Get all book-author relationships
router.get('/bookauthors', getAllBookAuthors);

// Get a single book-author relationship by ID
router.get('/bookauthors/:id', getBookAuthorById);

// Update a book-author relationship
router.put('/bookauthors/:id', updateBookAuthor);

// Delete a book-author relationship
router.delete('/bookauthors/:id', deleteBookAuthor);

module.exports = router;