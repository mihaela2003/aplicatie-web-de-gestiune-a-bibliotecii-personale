const ReviewMoods = require('../models/ReviewMoods');

const createReviewMood =  async (req, res) => {
    try {
      const { mood_id, review_id } = req.body;
      const association = await ReviewMoods.create({ mood_id, review_id });
      res.status(201).json(association);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
  
const getAllReviewMoods = async (req, res) => {
    try {
      const associations = await ReviewMoods.findAll();
      res.json(associations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
const deleteReviewMood = async (req, res) => {
    try {
      const { mood_id, review_id } = req.body;
      const deleted = await ReviewMoods.destroy({
        where: { mood_id, review_id }
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
    createReviewMood,
    getAllReviewMoods,
    deleteReviewMood
  };