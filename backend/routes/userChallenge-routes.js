const express = require('express');
const router = express.Router();

const {
  joinChallenge,
  getUserChallenges,
  getUserChallenge,
  leaveChallenge,
  getChallengeParticipants,
  getPendingInvites,
  updateChallengeInvite,
  checkChallengeParticipant,
  getUserChallengeByIds
} = require('../controllers/userChallenge-controller');

router.post('/:challengeId/join', joinChallenge);
router.get('/user/challenges', getUserChallenges);
router.get('/user/challenges/:id', getUserChallenge);
router.delete('/user/challenge/:id', leaveChallenge);
router.get('/challenges/:challengeId/participants', getChallengeParticipants);
router.get('/pending/:userId', getPendingInvites); 
router.put('/:id', updateChallengeInvite);
router.get('/check', checkChallengeParticipant);
router.get('/user/:userId/challenge/:challengeId', getUserChallengeByIds);
module.exports = router;