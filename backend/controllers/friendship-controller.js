const { Friendship, User, ReadingStatus, Book } = require('../models');
const { Op } = require('sequelize');

const sendFriendRequest = async (req, res) => {
  try {
    const { requesterId, recipientId } = req.body;

    const existingRequest = await Friendship.findOne({
      where: { requesterId, recipientId },
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Cererea de prietenie exista deja.' });
    }

    // Creează cererea
    const friendship = await Friendship.create({
      requesterId,
      recipientId,
      status: 'pending',
    });

    res.status(201).json(friendship);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllFriendships = async (req, res) => {
  try {
    const friendships = await Friendship.findAll({
      include: [
        { model: User, as: 'requester' },
        { model: User, as: 'recipient' },
      ],
    });
    res.status(200).json(friendships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateFriendshipStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const friendship = await Friendship.findByPk(id);
    if (!friendship) {
      return res.status(404).json({ error: 'Cererea de prietenie nu a fost găsită.' });
    }

    friendship.status = status;

    if (status === 'accepted') {
      await Friendship.create({
        requesterId: friendship.recipientId,
        recipientId: friendship.requesterId,
        status: 'accepted'
      });
    } else if (status === 'blocked') {
      const reciprocalFriendship = await Friendship.findOne({
        where: {
          requesterId: friendship.recipientId,
          recipientId: friendship.requesterId
        }
      });

      if (reciprocalFriendship) {
        reciprocalFriendship.status = 'hidden';
        await reciprocalFriendship.save();
      } else {
        await Friendship.create({
          requesterId: friendship.recipientId,
          recipientId: friendship.requesterId,
          status: 'hidden'
        });
      }
    }

    await friendship.save();

    res.status(200).json(friendship);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteFriendship = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    const friendship = await Friendship.findByPk(id);
    
    if (!friendship) {
      return res.status(404).json({ error: 'Cererea de prietenie nu a fost găsită.' });
    }

    if (status === 'accepted') {
      await Friendship.destroy({
        where: {
          [Op.or]: [
            { id },
            { 
              requesterId: friendship.recipientId,
              recipientId: friendship.requesterId 
            }
          ]
        }
      });
    } else {
      await friendship.destroy();
    }

    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getByRequesterId = async (req, res) => {
  try {
    const { requesterId } = req.params;

    const friendships = await Friendship.findAll({
      where: { requesterId },
      include: [
        { model: User, as: 'requester' },
        { model: User, as: 'recipient' },
      ],
    });

    res.status(200).json(friendships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPendingReceivedRequests = async (req, res) => {
  try {
    const { recipientId } = req.params;
    
    console.log('DEBUG: recipientId from params:', recipientId);
    
    const requests = await Friendship.findAll({
      where: { 
        recipientId,
        status: 'pending'
      },
      include: [
        { 
          model: User, 
          as: 'requester',
          attributes: ['id', 'username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log('DEBUG: Found requests:', requests.length);
    console.log('DEBUG: Requests data:', JSON.stringify(requests, null, 2));

    res.status(200).json(requests);
  } catch (error) {
    console.error('DEBUG: Error in getPendingReceivedRequests:', error);
    res.status(500).json({ error: error.message });
  }
};

const getByRecipientId = async (req, res) => {
  try {
    const { recipientId } = req.params;

    const friendships = await Friendship.findAll({
      where: { recipientId },
      include: [
        { model: User, as: 'requester' },
        { model: User, as: 'recipient' },
      ],
    });

    res.status(200).json(friendships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getFriendsUpdates = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = parseInt(userId);
    console.log("userid:", currentUserId);
    
    const friendships = await Friendship.findAll({
      where: {
        [Op.or]: [
          { requesterId: currentUserId, status: 'accepted' },
          { recipientId: currentUserId, status: 'accepted' }
        ]
      },
      include: [
        { 
          model: User, 
          as: 'requester',
          attributes: ['id', 'username'] 
        },
        { 
          model: User, 
          as: 'recipient',
          attributes: ['id', 'username'] 
        }
      ]
    });

    const friendIds = friendships.map(f => 
      f.requesterId === currentUserId ? f.recipientId : f.requesterId
    ).filter(id => id !== currentUserId && id !== null);

    console.log("Friend IDs:", friendIds);

    if (friendIds.length === 0) {
      return res.status(200).json([]);
    }

    const updates = await ReadingStatus.findAll({
      where: {
        user_id: { [Op.in]: friendIds }
      },
      include: [
        {
          model: User,
          attributes: ['id', 'username']
        },
        {
          model: Book,
          attributes: ['google_books_id', 'title']
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 10
    });

    console.log("Raw updates:", JSON.stringify(updates, null, 2));

    const formattedUpdates = updates.map(update => {
      if (!update.User) {
        console.warn("Update without user:", update.id);
        return null;
      }
      return {
        userId: update.User.id,
        username: update.User.username,
        bookId: update.id,
        title: update.Book ? update.Book.title : 'Unknown Title',
        google_books_id: update.Book ? update.Book.google_books_id : null,
        status: update.status,
        updatedAt: update.updatedAt
      };
    }).filter(update => update !== null);

    res.status(200).json(formattedUpdates);
  } catch (error) {
    console.error("Error getting friends updates:", error);
    res.status(500).json({ error: error.message });
  }
};

const unblockFriend = async (req, res) => {
  try {
    const { id } = req.params;

    const friendship = await Friendship.findByPk(id);
    
    if (!friendship) {
      return res.status(404).json({ error: 'Cererea de prietenie nu a fost găsită.' });
    }

    // Update the current friendship (from 'blocked' to 'accepted')
    friendship.status = 'accepted';
    await friendship.save();

    // Find and update the reciprocal friendship (from 'hidden' to 'accepted')
    const reciprocalFriendship = await Friendship.findOne({
      where: {
        requesterId: friendship.recipientId,
        recipientId: friendship.requesterId
      }
    });

    if (reciprocalFriendship) {
      reciprocalFriendship.status = 'accepted';
      await reciprocalFriendship.save();
    } else {
      // If no reciprocal friendship exists, create one with 'accepted' status
      await Friendship.create({
        requesterId: friendship.recipientId,
        recipientId: friendship.requesterId,
        status: 'accepted'
      });
    }

    res.status(200).json({ message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  sendFriendRequest,
  getAllFriendships,
  updateFriendshipStatus,
  deleteFriendship,
  getByRequesterId,
  getPendingReceivedRequests,
  getByRecipientId,
  getFriendsUpdates,
  unblockFriend
};