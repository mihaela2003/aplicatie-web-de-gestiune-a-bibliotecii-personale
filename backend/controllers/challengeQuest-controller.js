const { ChallengeQuest, QuestBook, Book, User, ReadingChallenge, UserChallenge, QuestProgress } = require('../models');

// Create a new quest with validations
const addQuest = async (req, res) => {
    try {
      console.log('Request body:', req.body); // Debug
      console.log('Challenge ID:', req.params.challengeId); // Debug
  
      // Validare tip quest
      const validTypes = ['custom', 'book_based', 'genre_based', 'count_based'];
      if (!validTypes.includes(req.body.type)) {
        return res.status(400).json({ error: 'Tip quest invalid. Alege între: ' + validTypes.join(', ') });
      }
  
      // Validare challenge existent
      const challengeExists = await ReadingChallenge.findByPk(req.params.challengeId);
      if (!challengeExists) {
        return res.status(404).json({ error: 'Challenge-ul nu există' });
      }
  
      // Validare câmpuri obligatorii
      if (!req.body.prompt || req.body.prompt.trim().length < 1) {
        return res.status(400).json({ error: 'Prompt-ul trebuie să aibă minim 1 caractere' });
      }
  
      // Asigură-te că targetCount este număr
      const targetCount = Number(req.body.targetCount) || 1;
      if (isNaN(targetCount)) {
        return res.status(400).json({ error: 'TargetCount trebuie să fie un număr' });
      }
  
      const quest = await ChallengeQuest.create({
        prompt: req.body.prompt.trim(),
        type: req.body.type,
        targetCount: targetCount,
        challengeId: req.params.challengeId
      });

      // CREATE QUEST PROGRESS FOR ALL PARTICIPANTS
      // Get all participants of this challenge
      const participants = await UserChallenge.findAll({
        where: { challengeId: req.params.challengeId }
      });

      // Create quest progress records for all participants
      for (const participant of participants) {
        await QuestProgress.create({
          userChallengeId: participant.id,
          questId: quest.id,
          progressCount: 0,
          completed: false
        });
      }

      console.log(`Created quest progress for ${participants.length} participants`);
  
      res.status(201).json(quest);
    } catch (error) {
      console.error('Error in addQuest:', error); // Debug
      res.status(500).json({ error: 'Eroare server: ' + error.message });
    }
  };

// Get quest with detailed validation
const getQuestById = async (req, res) => {
  try {
    if (isNaN(req.params.questId)) {
      return res.status(400).json({ error: 'ID quest invalid' });
    }

    const quest = await ChallengeQuest.findOne({
      where: { 
        id: req.params.questId,
        challengeId: req.params.challengeId 
      },
      include: [{
        model: QuestBook,
        include: [Book, { model: User, attributes: ['id', 'username'] }]
      }]
    });

    if (!quest) {
      return res.status(404).json({ error: 'Quest-ul nu a fost găsit' });
    }

    res.json(quest);
  } catch (error) {
    res.status(500).json({ error: 'Eroare server: ' + error.message });
  }
};

// Update quest with full validations
const updateQuest = async (req, res) => {
  try {
    // Verificare existență quest
    const quest = await ChallengeQuest.findOne({
      where: {
        id: req.params.questId,
        challengeId: req.params.challengeId
      }
    });

    if (!quest) {
      return res.status(404).json({ error: 'Quest-ul nu există' });
    }

    // Validare date actualizare
    const updates = {};
    if (req.body.prompt) {
      if (req.body.prompt.trim().length < 1) { // Fixed: was req.body.prompt.prompt()
        return res.status(400).json({ error: 'Prompt-ul trebuie să aibă minim 1 caractere' });
      }
      updates.prompt = req.body.prompt.trim();
    }

    if (req.body.type) {
      const validTypes = ['custom', 'book_based', 'genre_based', 'count_based'];
      if (!validTypes.includes(req.body.type)) {
        return res.status(400).json({ error: 'Tip quest invalid' });
      }
      updates.type = req.body.type;
    }

    if (req.body.targetCount) {
      if (isNaN(req.body.targetCount) || req.body.targetCount < 1) {
        return res.status(400).json({ error: 'TargetCount trebuie să fie un număr pozitiv' });
      }
      updates.targetCount = req.body.targetCount;
    }

    await ChallengeQuest.update(updates, {
      where: { id: req.params.questId }
    });

    const updatedQuest = await ChallengeQuest.findByPk(req.params.questId);
    res.json(updatedQuest);
  } catch (error) {
    res.status(500).json({ error: 'Eroare server: ' + error.message });
  }
};

// Delete quest with checks
const deleteQuest = async (req, res) => {
  try {
    // Verificare existență quest
    const quest = await ChallengeQuest.findOne({
      where: {
        id: req.params.questId,
        challengeId: req.params.challengeId
      }
    });

    if (!quest) {
      return res.status(404).json({ error: 'Quest-ul nu există' });
    }

    // Delete quest progress records first
    await QuestProgress.destroy({
      where: { questId: req.params.questId }
    });

    // Ștergem întâi cărțile asociate
    await QuestBook.destroy({
      where: { questId: req.params.questId }
    });

    // Ștergem quest-ul
    await quest.destroy();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Eroare server: ' + error.message });
  }
};

// Get all quests for a challenge with pagination
const getQuests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await ChallengeQuest.findAndCountAll({
      where: { challengeId: req.params.challengeId },
      include: [{
        model: QuestBook,
        include: [Book]
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      totalQuests: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      quests: rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Eroare server: ' + error.message });
  }
};

module.exports = {
  addQuest,
  getQuestById,
  updateQuest,
  deleteQuest,
  getQuests
};