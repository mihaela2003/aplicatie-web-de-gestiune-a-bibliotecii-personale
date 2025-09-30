const express = require('express');
const router = express.Router();

const {
    addBookToQuest,
    getQuestBook,
    getQuestBooks,
    updateQuestBook,
    removeBookFromQuest
} = require('../controllers/questBook-controller');

// Add a book to a quest
router.post('/:questId/books', addBookToQuest);

// Get all books for a quest
router.get('/:questId/books', getQuestBooks);

// Get a specific quest-book relationship
router.get('/:questId/books/:id', getQuestBook);

// Update a quest-book relationship
router.put('/:questId/books/:id', updateQuestBook);

// Remove a book from a quest
router.delete('/:questId/books/:id', removeBookFromQuest);

module.exports = router;