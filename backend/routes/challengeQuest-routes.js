const express = require('express');
const router = express.Router();

const {
  addQuest,
  getQuests,
  getQuestById,
  updateQuest,
  deleteQuest
} = require('../controllers/challengeQuest-controller');

// CRUD routes for quests
router.post('/:challengeId/quests', addQuest);
router.get('/:challengeId/quests', getQuests);
router.get('/:challengeId/quests/:questId', getQuestById);
router.put('/:challengeId/quests/:questId', updateQuest);
router.delete('/:challengeId/quests/:questId', deleteQuest);

module.exports = router;