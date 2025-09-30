const { UserChallenge, QuestProgress, ChallengeQuest, ReadingChallenge, User } = require('../models');

// Add this debug version to your userChallenge-controller.js

const joinChallenge = async (req, res) => {
  try {
    console.log('=== JOIN CHALLENGE DEBUG ===');
    console.log('req.params:', req.params);
    console.log('req.body:', req.body);
    console.log('req.url:', req.url);
    console.log('req.method:', req.method);
    
    // Get challengeId from URL parameters
    const { challengeId } = req.params;
    // Get userId from request body
    const { userId } = req.body;
    
    console.log('Extracted values:', { challengeId, userId });
    
    if (!challengeId || !userId) {
      console.log('Missing required parameters');
      return res.status(400).json({ 
        error: 'Missing challengeId or userId',
        received: { challengeId, userId }
      });
    }
    
    // Check if challenge exists
    const challenge = await ReadingChallenge.findByPk(challengeId);
    if (!challenge) {
      console.log('Challenge not found:', challengeId);
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Check if user is already in the challenge
    const existing = await UserChallenge.findOne({
      where: {
        userId: userId,
        challengeId: challengeId
      }
    });
    
    if (existing) {
      console.log('User already in challenge');
      return res.status(400).json({ error: 'User already joined this challenge' });
    }

    // Create the user-challenge relationship
    const userChallenge = await UserChallenge.create({
      userId: userId,
      challengeId: challengeId,
      status: 'accepted'
    });

    // Initialize progress for each quest in the challenge
    const quests = await ChallengeQuest.findAll({ 
      where: { challengeId: challengeId } 
    });
    
    await Promise.all(quests.map(quest =>
      QuestProgress.create({
        userChallengeId: userChallenge.id,
        questId: quest.id,
        progressCount: 0,
        completed: false
      })
    ));

    console.log('Successfully joined challenge:', userChallenge.id);
    res.status(201).json(userChallenge);
  } catch (error) {
    console.error('Error in joinChallenge:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
};

// Check if user is participant in a challenge
const checkChallengeParticipant = async (req, res) => {
  try {
    const { userId, challengeId } = req.body;
    
    const userChallenge = await UserChallenge.findOne({
      where: {
        userId: userId,
        challengeId: challengeId
      }
    });
    
    res.json({ isParticipant: !!userChallenge });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all challenges for current user
const getUserChallenges = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userChallenges = await UserChallenge.findAll({
      where: { userId: userId },
      include: [
        {
          model: ReadingChallenge,
          include: [
            { model: User, attributes: ['id', 'username'] }, // Removed 'as: Creator'
            { model: ChallengeQuest }
          ]
        },
        {
          model: QuestProgress,
          include: [ChallengeQuest]
        }
      ]
    });

    res.json(userChallenges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get specific user-challenge relationship
const getUserChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    
    const userChallenge = await UserChallenge.findOne({
      where: {
        id: id,
        userId: userId
      },
      include: [
        {
          model: ReadingChallenge,
          include: [
            { model: User, attributes: ['id', 'username'] }, // Removed 'as: Creator'
            { model: ChallengeQuest }
          ]
        },
        {
          model: QuestProgress,
          include: [ChallengeQuest]
        }
      ]
    });

    if (!userChallenge) {
      return res.status(404).json({ error: 'User challenge not found' });
    }

    res.json(userChallenge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Leave a challenge
const leaveChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const userChallenge = await UserChallenge.findOne({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!userChallenge) {
      return res.status(404).json({ error: 'User challenge not found' });
    }

    // Delete all associated progress records first
    await QuestProgress.destroy({
      where: { userChallengeId: userChallenge.id }
    });

    // Then delete the user-challenge relationship
    await userChallenge.destroy();

    res.json({ message: 'Successfully left the challenge' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get challenge participants
const getChallengeParticipants = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { userId } = req.query;
    
    // Check if challenge exists
    const challenge = await ReadingChallenge.findByPk(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Only challenge creator can see participants for private challenges
    if (!challenge.isPublic && challenge.userId !== parseInt(userId)) {
      return res.status(403).json({ error: 'Access to participants list denied' });
    }

    const participants = await UserChallenge.findAll({
      where: { challengeId: challengeId },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: QuestProgress,
          attributes: ['id', 'completed'],
          where: { completed: true },
          required: false
        }
      ]
    });

    res.json(participants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPendingInvites = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const invites = await UserChallenge.findAll({
            where: { 
                userId,
                status: 'pending'
            },
            include: [
                {
                    model: ReadingChallenge,
                    include: [{
                        model: User,
                        attributes: ['username'] // Removed 'as: Creator'
                    }]
                }
            ]
        });
        
        const formatted = invites.map(i => ({
            id: i.id,
            challengeId: i.ReadingChallenge.id,
            challengeTitle: i.ReadingChallenge.title,
            creator: i.ReadingChallenge.User.username // Changed from Creator to User
        }));
        
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update challenge invite status
const updateChallengeInvite = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const userChallenge = await UserChallenge.findByPk(id);
        if (!userChallenge) {
            return res.status(404).json({ error: 'Invite not found' });
        }
        
        await userChallenge.update({ status });
        
        // If accepted, initialize quest progress
        if (status === 'accepted') {
            const quests = await ChallengeQuest.findAll({ 
                where: { challengeId: userChallenge.challengeId } 
            });
            
            await Promise.all(quests.map(quest =>
                QuestProgress.create({
                    userChallengeId: userChallenge.id,
                    questId: quest.id,
                    progressCount: 0,
                    completed: false
                })
            ));
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserChallengeByIds = async (req, res) => {
  try {
    const { userId, challengeId } = req.params;
    
    const userChallenge = await UserChallenge.findOne({
      where: {
        userId: userId,
        challengeId: challengeId
      }
    });

    if (!userChallenge) {
      return res.status(404).json({ error: 'User challenge not found' });
    }

    res.json(userChallenge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  joinChallenge,
  getUserChallenges,
  getUserChallenge,
  leaveChallenge,
  getChallengeParticipants,
  getPendingInvites,
  updateChallengeInvite,
  checkChallengeParticipant,
  getUserChallengeByIds
};