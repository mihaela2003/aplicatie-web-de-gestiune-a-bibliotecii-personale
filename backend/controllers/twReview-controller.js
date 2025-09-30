const TWReview = require('../models/TWReview');

// Create association
const createTWReview = async (req, res) => {
  try {
    const { trigger_warning_id, review_id } = req.body;
    const association = await TWReview.create({ trigger_warning_id, review_id });
    res.status(201).json(association);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all associations
const getAllTWReviews = async (req, res) => {
  try {
    const associations = await TWReview.findAll();
    res.json(associations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete association
const deleteTWReview = async (req, res) => {
  try {
    const { trigger_warning_id, review_id } = req.body;
    const deleted = await TWReview.destroy({
      where: { trigger_warning_id, review_id }
    });
    if (deleted) {
      return res.json({ message: 'Association deleted' });
    }
    throw new Error('Association not found');
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
    createTWReview, 
    getAllTWReviews,
    deleteTWReview
};