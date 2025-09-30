const Book = require('./Carti');
const Author = require('./Autori');
const Genre = require('./Genuri');
const ReadingStatus = require('./ProgresLectura');
const User = require('./Utilizator');
const BookAuthor = require('./CartiAutori');
const BookGenre = require('./CartiGenuri');
const Review = require('./Review');
const Mood = require('./Moods');
const ReviewMood = require('./ReviewMoods');
const TW = require('./TriggerWarnings');
const TWReview = require('./TWReview');
const ReadingStreak = require('./ReadingStreaks');
const OwnedBook = require('./OwnedBooks');
const ReadingChallenge = require('./ReadingChallenge');
const ChallengeQuest = require('./ChallengeQuest');
const UserChallenge = require('./UserChallenge');
const QuestBook = require('./QuestBook');
const QuestProgress = require('./QuestProgress');
const Friendship = require('./Friendship');

// Definirea legăturilor
Book.belongsToMany(Author, { through: BookAuthor });
Author.belongsToMany(Book, { through: BookAuthor });

Book.belongsToMany(Genre, { through: BookGenre });
Genre.belongsToMany(Book, { through: BookGenre });

Book.hasMany(ReadingStatus, { foreignKey: 'book_id' });
ReadingStatus.belongsTo(Book, { foreignKey: 'book_id' });

User.hasMany(ReadingStatus, { foreignKey: 'user_id' });
ReadingStatus.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Review, {foreignKey: 'userId'});
Review.belongsTo(User, {foreignKey: 'userId'});

Book.hasMany(Review, {foreignKey: 'bookId'});
Review.belongsTo(Book, {foreignKey: 'bookId'});

Review.belongsToMany(Mood, { 
  through: ReviewMood,
  foreignKey: 'review_id',
  otherKey: 'mood_id'
});
Mood.belongsToMany(Review, { 
  through: ReviewMood,
  foreignKey: 'mood_id',
  otherKey: 'review_id'
});

Review.belongsToMany(TW, { 
  through: TWReview,
  foreignKey: 'review_id',
  otherKey: 'tw_id',
});
TW.belongsToMany(Review, { 
  through: TWReview,
  foreignKey: 'tw_id',
  otherKey: 'review_id'
});

User.hasOne(ReadingStreak, { foreignKey: 'user_id' });
ReadingStreak.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(OwnedBook, {foreignKey: 'userId'});
OwnedBook.belongsTo(User, {foreignKey: 'userId'});

Book.hasMany(OwnedBook, {foreignKey: 'bookId'});
OwnedBook.belongsTo(Book, {foreignKey: 'bookId'});

// OwnedBook has one ReadingStatus
OwnedBook.hasOne(ReadingStatus, {
    foreignKey: "ownedBookId", // coloana care le leagă
    as: "ReadingStatus" // numele sub care o vei accesa
  });
  
  // ReadingStatus belongs to OwnedBook
  ReadingStatus.belongsTo(OwnedBook, {
    foreignKey: "ownedBookId",
    as: "ownedBook"
  });

// Prieteniile unui user (ca și "requester")
User.hasMany(Friendship, {
    foreignKey: 'requesterId',
    as: 'sentFriendRequests' // nume pentru query-uri
});

// Prieteniile unui user (ca și "recipient")
User.hasMany(Friendship, {
    foreignKey: 'recipientId',
    as: 'receivedFriendRequests'
});

// Legătura către User pentru requester
Friendship.belongsTo(User, {
    foreignKey: 'requesterId',
    as: 'requester' // nume pentru query-uri
});

// Legătura către User pentru recipient
Friendship.belongsTo(User, {
    foreignKey: 'recipientId',
    as: 'recipient'
});

ReadingChallenge.belongsTo(User, {foreignKey: "userId"});
ReadingChallenge.hasMany(ChallengeQuest, {foreignKey: "challengeId"});
ReadingChallenge.hasMany(UserChallenge, {foreignKey: "challengeId"});

ChallengeQuest.belongsTo(ReadingChallenge, { foreignKey: 'challengeId' });
ChallengeQuest.hasMany(QuestBook, { foreignKey: 'questId' }); 
ChallengeQuest.hasMany(QuestProgress, { foreignKey: 'questId' });

QuestBook.belongsTo(ChallengeQuest, { foreignKey: 'questId' });
QuestBook.belongsTo(Book, { foreignKey: 'bookId' });
QuestBook.belongsTo(User, { foreignKey: 'addedBy' });

UserChallenge.belongsTo(User, { foreignKey: 'userId' });
UserChallenge.belongsTo(ReadingChallenge, { foreignKey: 'challengeId' });
UserChallenge.hasMany(QuestProgress, { foreignKey: 'userChallengeId' });

QuestProgress.belongsTo(UserChallenge, { foreignKey: 'userChallengeId' });
QuestProgress.belongsTo(ChallengeQuest, { foreignKey: 'questId' });

module.exports = {
    Book,
    Author,
    Genre,
    ReadingStatus,
    User,
    BookAuthor,
    BookGenre,
    Review,
    Mood,
    ReviewMood, 
    TW,
    TWReview,
    ReadingStreak, 
    OwnedBook,
    ReadingChallenge,
    ChallengeQuest,
    UserChallenge,
    QuestBook,
    QuestProgress,
    Friendship
};