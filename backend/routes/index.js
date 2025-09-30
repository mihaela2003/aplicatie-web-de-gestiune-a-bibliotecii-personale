const express = require('express');
const userRoutes = require('./user-routes');
const bookRoutes = require('./book-routes');
const authorRoutes = require('./author-routes');
const genreRoutes = require('./genre-routes');
const readingStatusRoutes = require('./readingStatus-routes');
const bookAuthorRoutes = require('./bookAuthor-routes');
const bookGenreRoutes = require('./bookGenre-routes');
const moodRoutes = require('./mood-routes');
const twRoutes = require('./tw-routes');
const reviewRoutes = require('./review-routes');
const reviewMoodRoutes = require('./reviewMoods-routes');
const twReviewRoutes = require('./twReview-routes');
const readingStreak = require('./readingStreak-routes');
const ownedBook = require('./ownedBook-routes');
const challengeQuest = require('./challengeQuest-routes');
const questBook = require('./questBook-routes');
const questProgress = require('./questProgress-routes');
const readingChallenge = require('./readingChallenge-routes');
const userChallenge = require('./userChallenge-routes');
const friendship = require('./friendship-routes');


const router = express.Router();

// Încarcă toate rutele
router.use('/users', userRoutes);
router.use('/books', bookRoutes);
router.use('/authors', authorRoutes);
router.use('/genres', genreRoutes);
router.use('/readingstatuses', readingStatusRoutes);
router.use('/bookauthors', bookAuthorRoutes);
router.use('/bookgenres', bookGenreRoutes);
router.use('/moods', moodRoutes);
router.use('/tw', twRoutes);
router.use('/reviews', reviewRoutes);
router.use('/reviewMoods', reviewMoodRoutes);
router.use('/twReview', twReviewRoutes);
router.use('/readingStreak', readingStreak);
router.use('/ownedbooks', ownedBook);
router.use('/challengeQuest', challengeQuest);
router.use('/questBook', questBook);
router.use('/questProgress', questProgress);
router.use('/readingChallenge', readingChallenge);
router.use('/userChallenge', userChallenge);
router.use('/friendships', friendship);

module.exports = router;