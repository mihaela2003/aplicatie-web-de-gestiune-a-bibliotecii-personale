const { ReadingChallenge, User, UserChallenge, ChallengeQuest, QuestProgress, Friendship } = require('../models');
const { Sequelize } = require('sequelize');
const { Op } = require('sequelize');

const createChallenge = async (req, res) => {
    try {
      console.log('Request body:', req.body); // Pentru debug
  
      // Validate required fields
      if (!req.body.title) {
        return res.status(400).json({ error: 'Title is required' });
      }
  
      // Validate dates if provided
      if (req.body.startDate && req.body.endDate && new Date(req.body.startDate) > new Date(req.body.endDate)) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }
  
      const challenge = await ReadingChallenge.create({
        title: req.body.title,
        description: req.body.description,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        isPublic: req.body.isPublic,
        userId: req.body.userId 
      });

      // Adaugă owner-ul ca participant automat cu status 'accepted'
      await UserChallenge.create({
        userId: challenge.userId, // Owner-ul
        challengeId: challenge.id, // Challenge-ul nou creat
        status: 'accepted' // Set status to 'accepted' for creator
      });
      
      res.status(201).json({
        id: challenge.id,
        ...challenge.toJSON()
      });
    } catch (error) {
      console.error('Error creating challenge:', error);
      res.status(500).json({ 
        error: error.message,
        stack: error.stack // Pentru debug
      });
    }
  };

// Get all public challenges - FIXED VERSION
const getPublicChallenges = async (req, res) => {
  try {
    console.log('Fetching public challenges...'); // Debug log
    
    const challenges = await ReadingChallenge.findAll({
      where: { isPublic: true },
      include: [
        { 
          model: User, 
          attributes: ['id', 'username'] 
        },
        { 
          model: UserChallenge,
          attributes: ['id'],
          include: [{ 
            model: User, 
            attributes: ['id', 'username'] 
          }]
        }
      ]
    });
    
    console.log(`Found ${challenges.length} public challenges`); // Debug log
    res.json(challenges);
  } catch (error) {
    console.error('Error in getPublicChallenges:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack // This will help debug the exact error
    });
  }
};

const getUserChallenges = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Challenges created by the user
    const createdChallenges = await ReadingChallenge.findAll({
      where: { userId: userId },
      include: [
        { 
          model: User, 
          attributes: ['id', 'username'] 
        },
        { 
          model: ChallengeQuest,
          attributes: ['id', 'prompt', 'type', 'targetCount'],
          include: [{
            model: QuestProgress,
            required: false,
            include: [{
              model: UserChallenge,
              where: { 
                userId: userId,
                status: 'accepted'
              },
              attributes: ['status']
            }],
            attributes: ['id', 'completed']
          }]
        }
      ],
      attributes: ['id', 'title', 'description', 'startDate', 'endDate', 'isPublic']
    });

    // Challenges the user is participating in (ONLY accepted ones)
    const participatingChallenges = await ReadingChallenge.findAll({
      include: [
        { 
          model: User, 
          attributes: ['id', 'username'] 
        },
        { 
          model: ChallengeQuest,
          attributes: ['id', 'prompt', 'type', 'targetCount'],
          include: [{
            model: QuestProgress,
            required: false,
            include: [{
              model: UserChallenge,
              where: { 
                userId: userId,
                status: 'accepted'
              },
              attributes: []
            }],
            attributes: ['id', 'completed']
          }]
        },
        {
          model: UserChallenge,
          where: { 
            userId: userId,
            status: 'accepted'  
          },
          attributes: ['id', 'status']
        }
      ],
      attributes: ['id', 'title', 'description', 'startDate', 'endDate', 'isPublic']
    });

    // Format response with quest counts
    const formatChallenges = (challenges) => {
      return challenges.map(challenge => ({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        questTarget: challenge.ChallengeQuests?.length || 0,
        completedQuests: challenge.ChallengeQuests?.reduce((count, quest) => {
          return count + (quest.QuestProgresses?.some(p => p.completed) ? 1 : 0);
        }, 0) || 0
      }));
    };

    res.json({
      created: formatChallenges(createdChallenges),
      participating: formatChallenges(participatingChallenges)
    });
  } catch (error) {
    console.error('Error in getUserChallenges:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
};
// Get challenge details
const getChallengeDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const challenge = await ReadingChallenge.findByPk(id, {
      include: [
        { model: User},
        { model: ChallengeQuest, include: ['QuestBooks'] },
        { model: UserChallenge, include: [User] }
      ]
    });

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (!challenge.isPublic) {
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required to view private challenge' });
      }

      if (challenge.userId !== parseInt(userId)) {
        const isParticipant = await UserChallenge.findOne({
          where: {
            challengeId: challenge.id,
            userId: userId
          }
        });

        if (!isParticipant) {
          return res.status(403).json({ error: 'Access to private challenge denied' });
        }
      }
    }

    res.json(challenge);
  } catch (error) {
    console.error('Error in getChallengeDetails:', error);  // <-- foarte important să vezi exact eroarea
    res.status(500).json({ error: error.message });
  }
};


// Update a challenge - FIXED to accept userId from query params
const updateChallenge = async (req, res) => {
  try {
    const { userId } = req.query; // Get userId from query params
    const challenge = await ReadingChallenge.findByPk(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Only allow creator to update
    if (challenge.userId !== parseInt(userId)) {
      return res.status(403).json({ error: 'Only challenge creator can update this challenge' });
    }

    // Validate dates
    if (req.body.startDate && req.body.endDate && 
        new Date(req.body.startDate) > new Date(req.body.endDate)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    await challenge.update(req.body);
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
};

// Replace your deleteChallenge function with this updated version
const deleteChallenge = async (req, res) => {
  try {
    const { userId } = req.query; // Get userId from query params
    const challenge = await ReadingChallenge.findByPk(req.params.id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Only allow creator to delete
    if (challenge.userId !== parseInt(userId)) {
      return res.status(403).json({ error: 'Only challenge creator can delete this challenge' });
    }

    await challenge.destroy();
    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get challenge statistics
const getChallengeStats = async (req, res) => {
  try {
    const challenge = await ReadingChallenge.findByPk(req.params.id, {
      attributes: [
        'id', 
        'title',
        [Sequelize.fn('COUNT', Sequelize.col('UserChallenges.id')), 'participantsCount']
      ],
      include: [
        {
          model: UserChallenge,
          attributes: [],
          include: [
            {
              model: QuestProgress,
              attributes: [],
              where: { completed: true }
            }
          ]
        }
      ],
      group: ['ReadingChallenge.id'],
      raw: true
    });

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Calculate completion percentage
    const totalQuests = await ChallengeQuest.count({ 
      where: { challengeId: req.params.id } 
    });
    
    const stats = {
      ...challenge,
      completionPercentage: totalQuests > 0 
        ? Math.round((challenge.completedQuests / (totalQuests * challenge.participantsCount)) * 100)
        : 0
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const checkChallengeParticipant = async (req, res) => {
  try {
    const userChallenge = await UserChallenge.findOne({
      where: {
        userId: req.params.userId,
        challengeId: req.params.challengeId
      }
    });
    
    res.json({ isParticipant: !!userChallenge });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const shareChallenge = async (req, res) => {
    try {
        const challengeId = req.params.id;
        console.log("challenge id: ", challengeId);
        const { userId } = req.body; // Preluat din frontend
        
        // Verifică dacă challenge-ul există
        const challenge = await ReadingChallenge.findByPk(challengeId);
        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }
        
        // Obține prietenii utilizatorului
        const friendships = await Friendship.findAll({
            where: {
                status: 'accepted',
                [Op.or]: [
                    { requesterId: userId },
                    { recipientId: userId }
                ]
            }
        });
        
        // Extrage ID-urile prietenilor
        const friendIds = friendships.map(f => 
            f.requesterId === parseInt(userId) ? f.recipientId : f.requesterId
        );
        
        // Creează invitațiile
        await Promise.all(friendIds.map(friendId => 
            UserChallenge.findOrCreate({
                where: { userId: friendId, challengeId },
                defaults: { status: 'pending' }
            })
        ));
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
  createChallenge,
  getPublicChallenges,
  getUserChallenges,
  getChallengeDetails,
  updateChallenge,
  deleteChallenge,
  getChallengeStats,
  checkChallengeParticipant,
  shareChallenge
};