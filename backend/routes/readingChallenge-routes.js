const express = require('express');
const router = express.Router();

const {
  createChallenge,
  getPublicChallenges,
  getUserChallenges,
  getChallengeDetails,
  updateChallenge,
  deleteChallenge,
  getChallengeStats,
  checkChallengeParticipant,
  shareChallenge
} = require('../controllers/readingChallenge-controller');

router.post('/', createChallenge);
router.get('/public', getPublicChallenges);
router.get('/user/:userId', getUserChallenges);
router.get('/:id', getChallengeDetails);
router.put('/:id', updateChallenge);
router.delete('/:id', deleteChallenge);
router.get('/:id/stats', getChallengeStats);
router.get('/check/:userId/:challengeId', checkChallengeParticipant);
router.post('/:id/share', shareChallenge);

module.exports = router;

