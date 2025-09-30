const BookAuthor  = require('../models');

// Create a new book-author relationship
const createBookAuthor = async (req, res) => {
    try {
        const { book_id, author_id } = req.body;
        const bookAuthor = await BookAuthor.create({ book_id, author_id });
        res.status(201).json(bookAuthor);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la crearea relației carte-autor', error });
    }
};

// Get all book-author relationships
const getAllBookAuthors = async (req, res) => {
    try {
        const bookAuthors = await BookAuthor.findAll();
        res.status(200).json(bookAuthors);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la obținerea relațiilor carte-autor', error });
    }
};

// Get a single book-author relationship by ID
const getBookAuthorById = async (req, res) => {
    try {
        const { id } = req.params;
        const bookAuthor = await BookAuthor.findByPk(id);
        if (bookAuthor) {
            res.status(200).json(bookAuthor);
        } else {
            res.status(404).json({ message: 'Relație carte-autor negăsită' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Eroare la obținerea relației carte-autor', error });
    }
};

// Update a book-author relationship
const updateBookAuthor = async (req, res) => {
    try {
        const { id } = req.params;
        const { book_id, author_id } = req.body;
        const [updated] = await BookAuthor.update({ book_id, author_id }, {
            where: { id }
        });
        if (updated) {
            const updatedBookAuthor = await BookAuthor.findByPk(id);
            res.status(200).json(updatedBookAuthor);
        } else {
            res.status(404).json({ message: 'Relație carte-autor negăsită' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Eroare la actualizarea relației carte-autor', error });
    }
};

// Delete a book-author relationship
const deleteBookAuthor = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await BookAuthor.destroy({
            where: { id }
        });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Relație carte-autor negăsită' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Eroare la ștergerea relației carte-autor', error });
    }
};

module.exports = {
    createBookAuthor,
    getAllBookAuthors,
    getBookAuthorById,
    updateBookAuthor,
    deleteBookAuthor
};