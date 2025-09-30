const { QuestBook, ChallengeQuest, Book, User, QuestProgress, UserChallenge, ReadingChallenge } = require('../models');
const jwt = require('jsonwebtoken'); // Add this import
const { Op } = require('sequelize');

// Use the same secret key as in your token creation
const SECRET_KEY = "cheia_super_secreta";

// Helper function to extract user ID from token
const getUserIdFromToken = (req) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    throw new Error('No authorization header provided');
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log('Token verified successfully for user:', decoded.userId);
    
    if (!decoded.userId) {
      throw new Error('No user ID found in token');
    }
    
    return decoded.userId;
  } catch (error) {
    console.error('JWT Error:', error.message);
    throw new Error(`Invalid token: ${error.message}`);
  }
};

// Helper function to update quest progress when a book is marked as read
const updateQuestProgress = async (questId, userId, bookReadDate) => {
  try {
    console.log(`Updating quest progress for quest ${questId}, user ${userId}, read date: ${bookReadDate}`);
    
    // Get the quest details
    const quest = await ChallengeQuest.findByPk(questId, {
      include: [{
        model: ReadingChallenge,
        attributes: ['startDate', 'endDate']
      }]
    });
    
    if (!quest) {
      console.log('Quest not found');
      return false;
    }
    
    const challenge = quest.ReadingChallenge;
    const readDate = new Date(bookReadDate);
    const startDate = challenge.startDate ? new Date(challenge.startDate) : null;
    const endDate = challenge.endDate ? new Date(challenge.endDate) : null;
    
    // Check if the read date is within the challenge period
    if (startDate && readDate < startDate) {
      console.log('Book read before challenge start date');
      return false;
    }
    
    if (endDate && readDate > endDate) {
      console.log('Book read after challenge end date');
      return false;
    }
    
    // Find the user's challenge participation
    const userChallenge = await UserChallenge.findOne({
      where: {
        userId: userId,
        challengeId: challenge.id
      }
    });
    
    if (!userChallenge) {
      console.log('User is not participating in this challenge');
      return false;
    }
    
    // Find the quest progress record
    const questProgress = await QuestProgress.findOne({
      where: {
        userChallengeId: userChallenge.id,
        questId: questId
      }
    });
    
    if (!questProgress) {
      console.log('Quest progress record not found');
      return false;
    }
    
    // Check if progress is already completed
    if (questProgress.completed) {
      console.log('Quest already completed');
      return false;
    }
    
    // Check if progress count is already at target
    if (questProgress.progressCount >= quest.targetCount) {
      console.log('Quest target already reached');
      return false;
    }
    
    // Update progress count
    const newProgressCount = questProgress.progressCount + 1;
    const isCompleted = newProgressCount >= quest.targetCount;
    
    await questProgress.update({
      progressCount: newProgressCount,
      completed: isCompleted,
      completedAt: isCompleted ? new Date() : null
    });
    
    console.log(`Quest progress updated: ${newProgressCount}/${quest.targetCount}, completed: ${isCompleted}`);
    return true;
    
  } catch (error) {
    console.error('Error updating quest progress:', error);
    return false;
  }
};

// Add a book to a quest
const addBookToQuest = async (req, res) => {
  try {
    const { bookId, status = 'want to read', readDate } = req.body;
    const questId = req.params.questId;
    
    // Extract userId from token instead of req.user
    let userId;
    try {
      userId = getUserIdFromToken(req);
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }

    // Validate required fields
    if (!bookId) {
      return res.status(400).json({ error: 'Book ID is required' });
    }

    if (!questId) {
      return res.status(400).json({ error: 'Quest ID is required' });
    }

    // Check if the book is already added to the quest by this user
    const existingBook = await QuestBook.findOne({
      where: {
        bookId: bookId,
        questId: questId,
        addedBy: userId
      }
    });

    if (existingBook) {
      return res.status(400).json({ error: 'You have already added this book to the quest' });
    }

    // Verify that the book exists in the database
    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({ error: 'Book not found in database' });
    }

    // Create the quest book entry with status
    const questBook = await QuestBook.create({
      bookId: bookId,
      questId: questId,
      addedBy: userId,
      status: status,
      readDate: readDate || null
    });
    
    // If the book is marked as read and has a read date, update quest progress
    if (status === 'read' && readDate) {
      await updateQuestProgress(questId, userId, readDate);
    }
    
    // Return the created quest book with related data
    const createdQuestBook = await QuestBook.findByPk(questBook.id, {
      include: [
        { 
          model: Book,
          required: false // Use LEFT JOIN instead of INNER JOIN
        },
        { 
          model: User, 
          attributes: ['id', 'username'],
          required: false // Use LEFT JOIN instead of INNER JOIN
        }
      ]
    });
    
    res.status(201).json(createdQuestBook);
  } catch (error) {
    console.error('Error adding book to quest:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all books for a quest - FIXED VERSION
const getQuestBooks = async (req, res) => {
  try {
    const questId = req.params.questId;
    const { userId } = req.query; // Get userId from query parameter
    
    console.log('Fetching books for quest ID:', questId);
    console.log('Filtering by user ID:', userId);
    
    // Validate questId
    if (!questId) {
      return res.status(400).json({ error: 'Quest ID is required' });
    }
    
    // Build where clause
    let whereClause = { questId: questId };
    
    // If userId is provided, filter by that user
    if (userId) {
      whereClause.addedBy = userId;
    }
    
    // Try a simpler query first to debug
    try {
      console.log('Attempting to fetch quest books with where clause:', whereClause);
      
      const books = await QuestBook.findAll({
        where: whereClause,
        include: [
          { 
            model: Book,
            // Remove 'authors' from attributes since it doesn't exist in your schema
            attributes: ['id', 'title', 'google_books_id'],
            required: false // Use LEFT JOIN to handle cases where Book might not exist
          },
          { 
            model: User, 
            attributes: ['id', 'username'],
            required: false // Use LEFT JOIN to handle cases where User might not exist
          }
        ],
        order: [['createdAt', 'DESC']] // Show newest additions first
      });
      
      console.log(`Found ${books.length} books for quest ${questId}${userId ? ` and user ${userId}` : ''}`);
      
      res.json(books);
      
    } catch (includeError) {
      console.error('Error with include query, trying simpler approach:', includeError);
      
      // Fallback: Try without includes first
      const simpleBooks = await QuestBook.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });
      
      console.log('Simple query successful, found:', simpleBooks.length, 'records');
      
      // If simple query works, the issue is with associations
      // Let's try to get the associated data separately
      const booksWithAssociations = await Promise.all(
        simpleBooks.map(async (questBook) => {
          try {
            const book = await Book.findByPk(questBook.bookId);
            const user = await User.findByPk(questBook.addedBy, {
              attributes: ['id', 'username']
            });
            
            return {
              ...questBook.toJSON(),
              Book: book ? book.toJSON() : null,
              User: user ? user.toJSON() : null
            };
          } catch (assocError) {
            console.error('Error fetching associations for quest book:', questBook.id, assocError);
            return {
              ...questBook.toJSON(),
              Book: null,
              User: null
            };
          }
        })
      );
      
      res.json(booksWithAssociations);
    }
    
  } catch (error) {
    console.error('Error fetching quest books:', error);
    console.error('Error details:', error.stack);
    
    // Return empty array instead of error to prevent frontend crashes
    res.json([]);
  }
};

// Get a specific quest-book relationship
const getQuestBook = async (req, res) => {
  try {
    const { id, questId } = req.params;
    
    const questBook = await QuestBook.findOne({
      where: { 
        id: id,
        questId: questId 
      },
      include: [
        { 
          model: Book,
          // Remove 'authors' from attributes since it doesn't exist in your schema
          attributes: ['id', 'title', 'cover_image', 'description', 'google_books_id'],
          required: false
        },
        { 
          model: User, 
          attributes: ['id', 'username'],
          required: false
        }
      ]
    });

    if (!questBook) {
      return res.status(404).json({ error: 'Quest book not found' });
    }

    res.json(questBook);
  } catch (error) {
    console.error('Error fetching quest book:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update a quest-book relationship (including status) - ENHANCED WITH PROGRESS TRACKING
const updateQuestBook = async (req, res) => {
  try {
    const { id, questId } = req.params;
    const { status, readDate } = req.body;
    
    // Get current quest book to compare status change
    const currentQuestBook = await QuestBook.findOne({
      where: { 
        id: id,
        questId: questId 
      }
    });

    if (!currentQuestBook) {
      return res.status(404).json({ error: 'Quest book not found' });
    }
    
    // Validate status if provided
    const validStatuses = ['want to read', 'currently reading', 'read'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: want to read, currently reading, read' 
      });
    }

    // Check if status is being changed to 'read'
    const isBeingMarkedAsRead = status === 'read' && currentQuestBook.status !== 'read';
    
    // If being marked as read and no readDate provided, use current date
    let finalReadDate = readDate;
    if (isBeingMarkedAsRead && !readDate) {
      finalReadDate = new Date().toISOString();
    }

    const [updated] = await QuestBook.update({
      ...req.body,
      readDate: finalReadDate
    }, {
      where: { 
        id: id,
        questId: questId 
      }
    });

    if (!updated) {
      return res.status(404).json({ error: 'Quest book not found' });
    }

    // If book is being marked as read, update quest progress
    if (isBeingMarkedAsRead && finalReadDate) {
      await updateQuestProgress(questId, currentQuestBook.addedBy, finalReadDate);
    }

    // Return updated quest book with related data
    const updatedQuestBook = await QuestBook.findOne({
      where: { id: id, questId: questId },
      include: [
        { 
          model: Book,
          // Remove 'authors' from attributes since it doesn't exist in your schema
          attributes: ['id', 'title', 'cover_image', 'description', 'google_books_id'],
          required: false
        },
        { 
          model: User, 
          attributes: ['id', 'username'],
          required: false
        }
      ]
    });
    
    res.json(updatedQuestBook);
  } catch (error) {
    console.error('Error updating quest book:', error);
    res.status(500).json({ error: error.message });
  }
};

// Remove a book from a quest - ENHANCED WITH PROGRESS TRACKING
const removeBookFromQuest = async (req, res) => {
  try {
    const { id, questId } = req.params;
    
    const questBook = await QuestBook.findOne({
      where: { 
        id: id,
        questId: questId 
      }
    });

    if (!questBook) {
      return res.status(404).json({ error: 'Quest book not found' });
    }

    // If the book was marked as read, we need to decrease the progress count
    if (questBook.status === 'read' && questBook.readDate) {
      // Find the user's quest progress and decrease count
      const userChallenge = await UserChallenge.findOne({
        where: {
          userId: questBook.addedBy,
          challengeId: (await ChallengeQuest.findByPk(questId, {
            include: [ReadingChallenge]
          })).ReadingChallenge.id
        }
      });
      
      if (userChallenge) {
        const questProgress = await QuestProgress.findOne({
          where: {
            userChallengeId: userChallenge.id,
            questId: questId
          }
        });
        
        if (questProgress && questProgress.progressCount > 0) {
          const newProgressCount = questProgress.progressCount - 1;
          const quest = await ChallengeQuest.findByPk(questId);
          
          await questProgress.update({
            progressCount: newProgressCount,
            completed: newProgressCount >= quest.targetCount,
            completedAt: newProgressCount >= quest.targetCount ? questProgress.completedAt : null
          });
          
          console.log(`Quest progress decreased: ${newProgressCount}/${quest.targetCount}`);
        }
      }
    }

    await questBook.destroy();
    
    res.json({ message: 'Book removed from quest successfully' });
  } catch (error) {
    console.error('Error removing book from quest:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addBookToQuest,
  getQuestBooks,
  getQuestBook,
  updateQuestBook,
  removeBookFromQuest
};