const express = require('express');
const router = express.Router();
const {
    createAuthor,
    getAllAuthors,
    getAuthorById,
    updateAuthor,
    deleteAuthor
} = require('../controllers/author-controller');

// Create a new author
router.post('/authors', createAuthor);

// Get all authors
router.get('/authors', getAllAuthors);

// Get a single author by ID
router.get('/authors/:id', getAuthorById);

// Update an author
router.put('/authors/:id', updateAuthor);

// Delete an author
router.delete('/authors/:id', deleteAuthor);

module.exports = router;