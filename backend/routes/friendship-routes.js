const express = require('express');
const router = express.Router();
const {
    sendFriendRequest,
    getAllFriendships,
    updateFriendshipStatus,
    deleteFriendship,
    getByRequesterId,
    getPendingReceivedRequests,
    getByRecipientId,
    getFriendsUpdates,
    unblockFriend
} = require('../controllers/friendship-controller');


// CRUD + getByRequesterId
router.post('/', sendFriendRequest);
router.get('/', getAllFriendships);
router.put('/:id', updateFriendshipStatus);
router.delete('/:id', deleteFriendship);
router.get('/requester/:requesterId', getByRequesterId);
router.get('/pending/:recipientId', getPendingReceivedRequests);
router.get('/recipient/:recipientId', getByRecipientId);
router.get('/:userId/updates', getFriendsUpdates);
router.put('/:id/unblock', unblockFriend);

module.exports = router;