const Genre  = require('../models');

// Create a new genre
const createGenre = async (req, res) => {
    try {
        const { name } = req.body;
        const genre = await Genre.create({ name });
        res.status(201).json(genre);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la crearea genului', error });
    }
};

// Get all genres
const getAllGenres = async (req, res) => {
    try {
        const genres = await Genre.findAll();
        res.status(200).json(genres);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la obținerea genurilor', error });
    }
};

// Get a single genre by ID
const getGenreById = async (req, res) => {
    try {
        const { id } = req.params;
        const genre = await Genre.findByPk(id);
        if (genre) {
            res.status(200).json(genre);
        } else {
            res.status(404).json({ message: 'Gen negăsit' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Eroare la obținerea genului', error });
    }
};

// Update a genre
const updateGenre = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const [updated] = await Genre.update({ name }, {
            where: { id }
        });
        if (updated) {
            const updatedGenre = await Genre.findByPk(id);
            res.status(200).json(updatedGenre);
        } else {
            res.status(404).json({ message: 'Gen negăsit' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Eroare la actualizarea genului', error });
    }
};

// Delete a genre
const deleteGenre = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Genre.destroy({
            where: { id }
        });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Gen negăsit' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Eroare la ștergerea genului', error });
    }
};

module.exports = {
    createGenre,
    getAllGenres,
    getGenreById,
    updateGenre,
    deleteGenre
};