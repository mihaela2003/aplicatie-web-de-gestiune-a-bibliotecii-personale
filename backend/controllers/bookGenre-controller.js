const BookGenre  = require('../models');

// Create a new book-genre relationship
const createBookGenre = async (req, res) => {
    try {
        const { book_id, genre_id } = req.body;
        const bookGenre = await BookGenre.create({ book_id, genre_id });
        res.status(201).json(bookGenre);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la crearea relației carte-gen', error });
    }
};

// Get all book-genre relationships
const getAllBookGenres = async (req, res) => {
    try {
        const bookGenres = await BookGenre.findAll();
        res.status(200).json(bookGenres);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la obținerea relațiilor carte-gen', error });
    }
};

// Get a single book-genre relationship by ID
const getBookGenreById = async (req, res) => {
    try {
        const { id } = req.params;
        const bookGenre = await BookGenre.findByPk(id);
        if (bookGenre) {
            res.status(200).json(bookGenre);
        } else {
            res.status(404).json({ message: 'Relație carte-gen negăsită' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Eroare la obținerea relației carte-gen', error });
    }
};

// Update a book-genre relationship
const updateBookGenre = async (req, res) => {
    try {
        const { id } = req.params;
        const { book_id, genre_id } = req.body;
        const [updated] = await BookGenre.update({ book_id, genre_id }, {
            where: { id }
        });
        if (updated) {
            const updatedBookGenre = await BookGenre.findByPk(id);
            res.status(200).json(updatedBookGenre);
        } else {
            res.status(404).json({ message: 'Relație carte-gen negăsită' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Eroare la actualizarea relației carte-gen', error });
    }
};

// Delete a book-genre relationship
const deleteBookGenre = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await BookGenre.destroy({
            where: { id }
        });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Relație carte-gen negăsită' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Eroare la ștergerea relației carte-gen', error });
    }
};

module.exports = {
    createBookGenre,
    getAllBookGenres,
    getBookGenreById,
    updateBookGenre,
    deleteBookGenre
};