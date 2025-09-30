const TW = require('../models/TriggerWarnings');

const createTW = async (req, res) => {
    try {
        const { name } = req.body;
        const tw = await TW.create({ name });
        res.status(201).json(tw);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
};

const getAllTW = async (req, res) => {
    try {
        const tws = await TW.findAll();
        res.json(tws);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
};

const getTWById = async (req, res) => {
    try {
        const tw = await TW.findByPk(req.params.id);
        if (!tw) {
          return res.status(404).json({ error: 'Trigger warning not found' });
        }
        res.json(tw);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
};

const updateTW = async (req, res) => {
    try {
        const { name } = req.body;
        const [updated] = await TW.update({ name }, {
          where: { id: req.params.id }
        });
        if (updated) {
          const updatedTW = await TW.findByPk(req.params.id);
          return res.json(updatedTW);
        }
        throw new Error('Trigger warning not found');
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
};

const deleteTW = async (req, res) => {
    try {
        const deleted = await TW.destroy({
          where: { id: req.params.id }
        });
        if (deleted) {
          return res.json({ message: 'Trigger warning deleted' });
        }
        throw new Error('Trigger warning not found');
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
};

module.exports = {
    createTW, 
    getAllTW,
    getTWById,
    updateTW,
    deleteTW
}