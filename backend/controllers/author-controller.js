const Author = require('../models/Autori');

// Create a new author
const createAuthor = async (req, res) => {
    try {
        const { name } = req.body;
        const author = await Author.create({ name });
        res.status(201).json(author);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la crearea autorului', error });
    }
};

// Get all authors
const getAllAuthors = async (req, res) => {
    try {
        const authors = await Author.findAll();
        res.status(200).json(authors);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la obținerea autorilor', error });
    }
};

// Get a single author by ID
const getAuthorById = async (req, res) => {
    try {
        const { id } = req.params;
        const author = await Author.findByPk(id);
        if (author) {
            res.status(200).json(author);
        } else {
            res.status(404).json({ message: 'Autor negăsit' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Eroare la obținerea autorului', error });
    }
};

// Update an author
const updateAuthor = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const [updated] = await Author.update({ name }, {
            where: { id }
        });
        if (updated) {
            const updatedAuthor = await Author.findByPk(id);
            res.status(200).json(updatedAuthor);
        } else {
            res.status(404).json({ message: 'Autor negăsit' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Eroare la actualizarea autorului', error });
    }
};

// Delete an author
const deleteAuthor = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Author.destroy({
            where: { id }
        });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Autor negăsit' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Eroare la ștergerea autorului', error });
    }
};

module.exports = {
    createAuthor,
    getAllAuthors,
    getAuthorById,
    updateAuthor,
    deleteAuthor
};