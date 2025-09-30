// routes/genre-routes.js
const express = require('express');
const router = express.Router();
const {
    createGenre,
    getAllGenres,
    getGenreById,
    updateGenre,
    deleteGenre
} = require('../controllers/genre-controller');

// Create a new genre
router.post('/genres', createGenre);

// Get all genres
router.get('/genres', getAllGenres);

// Get a single genre by ID
router.get('/genres/:id', getGenreById);

// Update a genre
router.put('/genres/:id', updateGenre);

// Delete a genre
router.delete('/genres/:id', deleteGenre);

module.exports = router;