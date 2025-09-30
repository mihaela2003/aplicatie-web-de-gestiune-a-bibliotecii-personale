const ReadingStatus = require('../models/ProgresLectura');
const db = require('../config/database'); 


const createReadingStatus = async (req, res) => {
    try {
        const { status,pages, currently_reading_start_date, read_finish_date, user_id, book_id } = req.body;
        const readingStatus = await ReadingStatus.create({ status, pages, currently_reading_start_date, read_finish_date, user_id, book_id });
        res.status(201).json(readingStatus);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la crearea starii de citire', error });
    }
};

const getAllReadingStatuses = async (req, res) => {
    try {
        const readingStatuses = await ReadingStatus.findAll();
        res.status(200).json(readingStatuses);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la obținerea stărilor de citire', error });
    }
};

const getReadingStatusById = async (req, res) => {
    try {
        const { id } = req.params;
        const readingStatus = await ReadingStatus.findByPk(id);
        if (readingStatus) {
            res.status(200).json(readingStatus);
        } else {
            res.status(404).json({ message: 'Stare de citire negăsită' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Eroare la obținerea stării de citire', error });
    }
};
// Add these imports at the top of your controller file
const UserChallenge = require('../models/UserChallenge');
const ReadingChallenge = require('../models/ReadingChallenge');
const ChallengeQuest = require('../models/ChallengeQuest');
const QuestProgress = require('../models/QuestProgress');
const QuestBook = require('../models/QuestBook');

// Fixed helper function to update quest progress when a book is marked as read
const updateQuestProgress = async (readingStatus) => {
    try {
        const { user_id, book_id, read_finish_date } = readingStatus;
        
        if (!read_finish_date) {
            console.log("No finish date set, skipping quest progress update");
            return;
        }

        console.log(`Checking quest progress for user ${user_id}, book ${book_id}`);

        // Find all active user challenges for this user
        const userChallenges = await UserChallenge.findAll({
            where: { 
                userId: user_id,
                status: 'accepted'
            },
            include: [
                {
                    model: ReadingChallenge,
                    include: [
                        {
                            model: ChallengeQuest,
                            include: [
                                {
                                    model: QuestBook,
                                    where: { bookId: book_id }, // Find quests that have this specific book
                                    required: true // Only include challenges that have a quest with this book
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        console.log(`Found ${userChallenges.length} relevant user challenges`);

        // Process each relevant user challenge
        for (const userChallenge of userChallenges) {
            const challenge = userChallenge.ReadingChallenge;
            const challengeStartDate = new Date(challenge.startDate);
            const challengeEndDate = new Date(challenge.endDate);
            const finishDate = new Date(read_finish_date);

            console.log(`Checking challenge ${challenge.id}:`);
            console.log(`Challenge dates: ${challengeStartDate} to ${challengeEndDate}`);
            console.log(`Book finish date: ${finishDate}`);
            console.log(`Challenge start date valid: ${!isNaN(challengeStartDate.getTime())}`);
            console.log(`Challenge end date valid: ${!isNaN(challengeEndDate.getTime())}`);
            console.log(`Finish date valid: ${!isNaN(finishDate.getTime())}`);

            // Check if the finish date is within the challenge period
            if (finishDate >= challengeStartDate && finishDate <= challengeEndDate) {
                console.log(`✅ Book finished within challenge period, updating progress`);

                // Process each quest in this challenge that contains the book
                console.log(`Number of quests in challenge: ${challenge.ChallengeQuests.length}`);
                
                for (const quest of challenge.ChallengeQuests) {
                    console.log(`Processing quest ${quest.id}, has ${quest.QuestBooks.length} books`);
                    
                    // Check if this quest has the book we just finished
                    const questBook = quest.QuestBooks.find(qb => qb.bookId === book_id);
                    
                    if (questBook) {
                        console.log(`✅ Found quest ${quest.id} that includes book ${book_id}`);
                        
                        try {
                            // Find or create the quest progress record
                            let questProgress = await QuestProgress.findOne({
                                where: {
                                    userChallengeId: userChallenge.id,
                                    questId: quest.id
                                }
                            });

                            console.log(`Quest progress found: ${questProgress ? 'YES' : 'NO'}`);

                            if (!questProgress) {
                                // Create new quest progress if it doesn't exist
                                console.log(`Creating new quest progress for userChallenge ${userChallenge.id}, quest ${quest.id}`);
                                questProgress = await QuestProgress.create({
                                    userChallengeId: userChallenge.id,
                                    questId: quest.id,
                                    progressCount: 0,
                                    completed: false
                                });
                                console.log(`✅ Created new quest progress with ID: ${questProgress.id}`);
                            }

                            // Increment progress count and check if quest is completed
                            const currentProgress = questProgress.progressCount;
                            const newProgressCount = currentProgress + 1;
                            const isCompleted = newProgressCount >= quest.targetCount;

                            console.log(`Current progress: ${currentProgress}, New progress: ${newProgressCount}, Target: ${quest.targetCount}`);

                            const updateResult = await questProgress.update({
                                progressCount: newProgressCount,
                                completed: isCompleted,
                                completedAt: isCompleted ? new Date() : questProgress.completedAt
                            });

                            console.log(`✅ Updated quest progress successfully: ${newProgressCount}/${quest.targetCount}, completed: ${isCompleted}`);
                            console.log(`Update result:`, updateResult.toJSON());
                            
                        } catch (progressError) {
                            console.error(`❌ Error updating progress for quest ${quest.id}:`, progressError);
                        }
                    } else {
                        console.log(`❌ Quest ${quest.id} does not include book ${book_id}`);
                    }
                }
            } else {
                console.log(`❌ Book finished outside challenge period, skipping`);
                console.log(`Finish date: ${finishDate.toISOString()}`);
                console.log(`Challenge start: ${challengeStartDate.toISOString()}`);
                console.log(`Challenge end: ${challengeEndDate.toISOString()}`);
            }
        }
    } catch (error) {
        console.error("Error updating quest progress:", error);
        // Don't throw the error to avoid breaking the main reading status update
    }
};

const updateReadingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; 
        
        console.log(`Trying to update reading status with ID: ${id}, new status: ${status}`);

        const updateData = { status };

        if (status === "currently_reading"){
            updateData.page_counter = 0;
            updateData.read_finish_date = null;
            console.log("Resetting page_counter to 0 for currently_reading status")
        }
        
        const [updated] = await ReadingStatus.update(updateData, {
            where: { id }
        });
        
        if (updated) {
            const updatedReadingStatus = await ReadingStatus.findByPk(id);
            console.log("Status updated successfully:", updatedReadingStatus);

            res.status(200).json(updatedReadingStatus);
        } else {
            console.log(`No reading status found with ID: ${id}`);
            res.status(404).json({ message: 'Stare de citire negăsită' });
        }
    } catch (error) {
        console.error("Error updating reading status:", error);
        res.status(500).json({ message: 'Eroare la actualizarea stării de citire', error: error.message });
    }
};

const deleteReadingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await ReadingStatus.destroy({
            where: { id }
        });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Stare de citire negăsită' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Eroare la ștergerea stării de citire', error });
    }
};

const getReadingStatusByBookAndUser = async (req, res) => {
    try {
        const { user_id, book_id } = req.params;

        if (!book_id || !user_id) {
            return res.status(400).json({ message: "Lipsesc user_id sau book_id în URL" });
        }

        const parsedBookId = parseInt(book_id, 10);
        const parsedUserId = parseInt(user_id, 10);

        if (isNaN(parsedBookId) || isNaN(parsedUserId)) {
            return res.status(400).json({ message: "Parametrii trebuie sa fie numere valide" });
        }

        const readingStatus = await ReadingStatus.findOne({
            where: { 
                book_id: parsedBookId,
                user_id: parsedUserId
            }
        });

        if (!readingStatus) {
            return res.status(404).json({ exists: false, message: 'Status de citire negasit' });
        }

        res.status(200).json({ exists: true, data: readingStatus });
    } catch (error) {
        console.error("Eroare la obtinerea statusului:", error);
        res.status(500).json({ message: 'Eroare la obtinerea statusului', error: error.message });
    }
};

const getUserReadingStatuses = async (req, res) => {
    const userId = req.params.userId;
    
    try {
        const results = await db.query(`
            SELECT 
                rs.id, 
                rs.status, 
                b.title, 
                b.google_books_id,
                rs.updatedAt,
                rs.pages,
                rs.page_counter,
                rs.book_id
            FROM readingstatuses rs
            JOIN books b ON rs.book_id = b.id
            WHERE rs.user_id = ?
            GROUP BY rs.book_id, rs.id, rs.status, b.title, b.google_books_id, rs.updatedAt, rs.pages, rs.page_counter
        `, {
            replacements: [userId],
            type: db.QueryTypes.SELECT
        });
        
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching reading statuses:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateStartDate = async (req, res) => {
    try {
        const { id } = req.params;
        const { currently_reading_start_date } = req.body;
        console.log(currently_reading_start_date);
        
        const [updated] = await ReadingStatus.update({ 
            currently_reading_start_date 
        }, {
            where: { id }
        });
        
        if (updated) {
            const updatedStatus = await ReadingStatus.findByPk(id);
            res.status(200).json(updatedStatus);
        } else {
            res.status(404).json({ message: 'Stare de citire negăsită' });
        }
    } catch (error) {
        res.status(500).json({ 
            message: 'Eroare la actualizarea datei de început', 
            error: error.message 
        });
    }
};

const updateFinishDate = async (req, res) => {
    try {
        const { id } = req.params;
        const { read_finish_date } = req.body;
        console.log(read_finish_date);
        
        const [updated] = await ReadingStatus.update({ 
            read_finish_date 
        }, {
            where: { id }
        });
        
        if (updated) {
            const updatedStatus = await ReadingStatus.findByPk(id);
            await updateQuestProgress(updatedStatus);
            res.status(200).json(updatedStatus);
        } else {
            res.status(404).json({ message: 'Stare de citire negăsită' });
        }
    } catch (error) {
        res.status(500).json({ 
            message: 'Eroare la actualizarea datei de final', 
            error: error.message 
        });
    }
};

const updatePageCounter = async (req, res) => {
    try {
        const { id } = req.params;
        const { page_counter } = req.body;
        console.log(page_counter);
        
        const [updated] = await ReadingStatus.update({ 
            page_counter 
        }, {
            where: { id }
        });
        
        if (updated) {
            const updatedStatus = await ReadingStatus.findByPk(id);
            res.status(200).json(updatedStatus);
        } else {
            res.status(404).json({ message: 'Stare de citire negăsită' });
        }
    } catch (error) {
        res.status(500).json({ 
            message: 'Eroare la actualizarea contorului de pagini', 
            error: error.message 
        });
    }
};

const updatePages = async (req, res) => {
    try {
        const { id } = req.params;
        const { pages } = req.body;
        console.log("pages: ",pages);

        const [updated] = await ReadingStatus.update({
            pages
        }, {
            where: {id}
        });

        if (updated) {
            const updatedStatus = await ReadingStatus.findByPk(id);
            res.status(200).json(updatedStatus);
        } else {
            res.status(400).json({message: 'Stare de citire negasita'});
        }
    } catch (error) {
        res.status(500).json({
            message: 'Eroare la actualizarea numarului de pagini al unei carti.',
            error: error.message
        });
    }
};

module.exports = {
    createReadingStatus,
    getAllReadingStatuses,
    getReadingStatusById,
    updateReadingStatus,
    deleteReadingStatus, 
    getReadingStatusByBookAndUser,
    getUserReadingStatuses,
    updateStartDate,
    updateFinishDate,
    updatePageCounter,
    updatePages,
};