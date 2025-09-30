const { QuestProgress, UserChallenge, ChallengeQuest } = require('../models');

// Create a new quest progress record
const createProgress = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.userChallengeId || !req.body.questId) {
      return res.status(400).json({ error: 'userChallengeId and questId are required' });
    }

    // Check if the user challenge exists
    const userChallenge = await UserChallenge.findByPk(req.body.userChallengeId);
    if (!userChallenge) {
      return res.status(404).json({ error: 'User challenge not found' });
    }

    // Check if the quest exists
    const quest = await ChallengeQuest.findByPk(req.body.questId);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    // Check if progress already exists for this quest and user challenge
    const existingProgress = await QuestProgress.findOne({
      where: {
        userChallengeId: req.body.userChallengeId,
        questId: req.body.questId
      }
    });

    if (existingProgress) {
      return res.status(400).json({ error: 'Progress record already exists for this quest and user challenge' });
    }

    const progress = await QuestProgress.create({
      userChallengeId: req.body.userChallengeId,
      questId: req.body.questId,
      progressCount: req.body.progressCount || 0,
      completed: req.body.completed || false
    });

    res.status(201).json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all progress records for a user challenge
const getAllProgress = async (req, res) => {
  try {
    const progressRecords = await QuestProgress.findAll({
      where: { userChallengeId: req.params.userChallengeId },
      include: [
        { model: ChallengeQuest }
      ]
    });

    res.json(progressRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a specific progress record
const getProgress = async (req, res) => {
  try {
    const progress = await QuestProgress.findOne({
      where: {
        id: req.params.progressId,
        userChallengeId: req.params.userChallengeId
      },
      include: [
        { model: ChallengeQuest }
      ]
    });

    if (!progress) {
      return res.status(404).json({ error: 'Progress record not found' });
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update quest progress
const updateProgress = async (req, res) => {
  try {
    const progress = await QuestProgress.findOne({
      where: {
        id: req.params.progressId,
        userChallengeId: req.params.userChallengeId
      }
    });

    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    // Validate completedAt can only be set when completing the quest
    if (req.body.completed && !progress.completed) {
      req.body.completedAt = new Date();
    } else if (!req.body.completed && progress.completed) {
      req.body.completedAt = null;
    }

    await progress.update(req.body);
    
    // Check if all quests are completed
    const allCompleted = await checkChallengeCompletion(req.params.userChallengeId);
    
    res.json({
      progress,
      challengeCompleted: allCompleted
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a progress record
const deleteProgress = async (req, res) => {
  try {
    const progress = await QuestProgress.findOne({
      where: {
        id: req.params.progressId,
        userChallengeId: req.params.userChallengeId
      }
    });

    if (!progress) {
      return res.status(404).json({ error: 'Progress record not found' });
    }

    await progress.destroy();
    
    res.json({ message: 'Progress record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function to check if all quests in a challenge are completed
async function checkChallengeCompletion(userChallengeId) {
  const incomplete = await QuestProgress.findOne({
    where: {
      userChallengeId,
      completed: false
    }
  });
  return !incomplete;
}

module.exports = {
  createProgress,
  getAllProgress,
  getProgress,
  updateProgress,
  deleteProgress
};