const Mood = require('../models/Moods');

const createMood = async (req, res) => {
    try {
        const { name } = req.body;
        const mood = await Mood.create({ name });
        res.status(201).json(mood);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
};

const getAllMoods = async (req, res) => {
    try {
        const moods = await Mood.findAll();
        res.json(moods);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
};

const getMoodById = async (req, res) =>{
    try {
        const mood = await Mood.findByPk(req.params.id);
        if (!mood) {
          return res.status(404).json({ error: 'Mood not found' });
        }
        res.json(mood);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
};

const updateMood = async (req, res) => {
    try {
        const { name } = req.body;
        const [updated] = await Mood.update({ name }, {
          where: { id: req.params.id }
        });
        if (updated) {
          const updatedMood = await Mood.findByPk(req.params.id);
          return res.json(updatedMood);
        }
        throw new Error('Mood not found');
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
};

const deleteMood = async (req, res) =>{
    try {
        const deleted = await Mood.destroy({
          where: { id: req.params.id }
        });
        if (deleted) {
          return res.json({ message: 'Mood deleted' });
        }
        throw new Error('Mood not found');
      } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    createMood,
    getAllMoods,
    getMoodById,
    updateMood,
    deleteMood
}