const express = require("express");
const {
    searchBooks,
    getSeriesInfo,
    createBook,
    getAllBooks,
    getBookById,
    updateBook,
    deleteBook,
    getBookByGoogleId
} = require("../controllers/book-controller")

const router = express.Router();

//search book and book seriers
router.get("/search", searchBooks);
router.get("/series", getSeriesInfo);

//crud
router.post("/", createBook);
router.get('/', getAllBooks);
router.get('/:id', getBookById);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);
router.get('/google/:googleId', getBookByGoogleId);

module.exports = router;