const { Review, Mood, TW, ReviewMood, TWReview, Book, User } = require('../models');
const { Op } = require('sequelize');

const createReview = async (req, res) => {
    try {
        const review = await Review.create(req.body);
        res.status(201).json(review);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
};

const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.findAll();
        res.json(reviews);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
};

const getReviewById = async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);
        if (!review) {
          return res.status(404).json({ error: 'Review not found' });
        }
        res.json(review);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
};

const updateReview = async (req, res) => {
    try {
        const [updated] = await Review.update(req.body, {
          where: { id: req.params.id }
        });
        if (updated) {
          const updatedReview = await Review.findByPk(req.params.id);
          return res.json(updatedReview);
        }
        throw new Error('Review not found');
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
};

const deleteReview = async (req, res) => {
    try {
        const deleted = await Review.destroy({
          where: { id: req.params.id }
        });
        if (deleted) {
          return res.json({ message: 'Review deleted' });
        }
        throw new Error('Review not found');
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
};

const createOrUpdateReview = async (req, res) => {
    const {
        rating,
        bookPacing,
        plotOrCharacter,
        characterDevelopment,
        charactersLoveable,
        flawsFocus,
        reviewText,
        moods = [],
        triggerWarnings = [],
        googleBooksId,
        userId 
    } = req.body;

    const book = await Book.findOne({
        where: { google_books_id: googleBooksId }
    });

    if (!book) {
        return res.status(404).json({
            success: false,
            message: 'Book not found in database'
        });
    }

    try {
        // Verificăm dacă review-ul există deja
        const existingReview = await Review.findOne({
            where: { bookId: book.id, userId }
        });

        let review;
        
        // Creare sau actualizare review
        if (existingReview) {
            review = await existingReview.update({
                rating,
                bookPacing,
                plotOrCharacter,
                characterDevelopment,
                charactersLoveable,
                flawsFocus,
                reviewText
            });
        } else {
            review = await Review.create({
                rating,
                bookPacing,
                plotOrCharacter,
                characterDevelopment,
                charactersLoveable,
                flawsFocus,
                reviewText,
                bookId: book.id,
                userId
            });
        }

        // Procesare moods
        if (moods.length > 0) {
            // Găsim sau creăm mood-urile
            const moodRecords = await Promise.all(
                moods.map(async moodName => {
                    const [mood] = await Mood.findOrCreate({
                        where: { name: moodName },
                        defaults: { name: moodName }
                    });
                    return mood;
                })
            );

            // Ștergem legăturile vechi
            await ReviewMood.destroy({ where: { review_id: review.id } });

            // Creăm legăturile noi
            await Promise.all(
                moodRecords.map(mood => 
                    ReviewMood.create({
                        review_id: review.id,
                        mood_id: mood.id
                    })
                )
            );
        }

        // Procesare trigger warnings
        if (triggerWarnings.length > 0) {
            // Găsim sau creăm trigger warning-urile
            const twRecords = await Promise.all(
                triggerWarnings.map(async twName => {
                    const [tw] = await TW.findOrCreate({
                        where: { name: twName },
                        defaults: { name: twName }
                    });
                    return tw;
                })
            );

            // Ștergem legăturile vechi
            await TWReview.destroy({ where: { review_id: review.id } });

            // Creăm legăturile noi
            await Promise.all(
                twRecords.map(tw => 
                    TWReview.create({
                        review_id: review.id,
                        tw_id: tw.id
                    })
                )
            );
        }

        // Obținem review-ul complet cu relațiile
        const fullReview = await Review.findByPk(review.id, {
            include: [
                { model: Mood, through: { attributes: [] } },
                { model: TW, through: { attributes: [] } }
            ]
        });

        res.status(200).json({
            success: true,
            message: existingReview ? 'Review updated successfully' : 'Review created successfully',
            review: fullReview
        });

    } catch (error) {
        console.error('Error saving review:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving review',
            error: error.message
        });
    }
};

const getReviewByBookAndUser = async (req, res) => {
    try {
        const { bookId, userId } = req.params;
        const book = await Book.findOne({
            where: { google_books_id: bookId }
        });
    
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found in database'
            });
        }

        const review = await Review.findOne({
            where: { bookId: book.id, userId },
            include: [
                { model: Mood, as: 'Moods', through: { attributes: [] } },
                { model: TW, as: 'TriggerWarnings', through: { attributes: [] } }
            ]
        });

        if (!review) {
            return res.status(404).json({ 
                exists: false, 
                message: 'Review not found' 
            });
        }

        res.status(200).json({ exists: true, review });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching review', 
            error: error.message 
        });
    }
};

// Updated getReviewStats function in review-controller.js
const getReviewStats = async (req, res) => {
  try {
    const { bookId } = req.params;
    
    // Find the book in our database
    const book = await Book.findOne({
      where: { google_books_id: bookId }
    });

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Get all reviews for this book - NOTE: Updated the include structure
    const reviews = await Review.findAll({
      where: { bookId: book.id },
      include: [
        { 
          model: Mood, 
          as: 'Moods', // Use the same alias as in getReviewByBookAndUser
          through: { attributes: [] },
          attributes: ['id', 'name'] // Only get what we need
        },
        { 
          model: TW, 
          as: 'TriggerWarnings', // Use the same alias as in getReviewByBookAndUser
          through: { attributes: [] },
          attributes: ['id', 'name'] // Only get what we need
        }
      ]
    });

    console.log('Number of reviews found:', reviews.length);
    
    // Debug: Log the first review to see the structure
    if (reviews.length > 0) {
      console.log('First review structure:', JSON.stringify(reviews[0], null, 2));
    }

    if (reviews.length === 0) {
      return res.status(404).json({ message: 'No reviews found for this book' });
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + parseFloat(review.rating), 0);
    const averageRating = totalRating / reviews.length;

    // Calculate mood percentages - FIXED: Use correct property name
    const moodCounts = {};
    reviews.forEach(review => {
      // Now using the correct alias 'Moods'
      const moods = review.Moods || [];
      console.log(`Review ${review.id} moods:`, moods.length);
      
      moods.forEach(mood => {
        const moodName = mood.name.toLowerCase();
        moodCounts[moodName] = (moodCounts[moodName] || 0) + 1;
      });
    });

    console.log('Mood counts:', moodCounts);

    const moods = {};
    Object.entries(moodCounts).forEach(([mood, count]) => {
      moods[mood] = Math.round((count / reviews.length) * 100);
    });

    // Calculate pace distribution
    const paceCounts = {
      slow: 0,
      medium: 0,
      fast: 0
    };

    reviews.forEach(review => {
      const pace = review.bookPacing.toLowerCase();
      if (pace in paceCounts) {
        paceCounts[pace]++;
      }
    });

    const pace = {
      slow: Math.round((paceCounts.slow / reviews.length) * 100),
      medium: Math.round((paceCounts.medium / reviews.length) * 100),
      fast: Math.round((paceCounts.fast / reviews.length) * 100)
    };

    // Calculate plot vs character driven
    const plotCharacterCounts = {
      plot: 0,
      character: 0,
      balanced: 0,
      na: 0
    };

    reviews.forEach(review => {
      const type = review.plotOrCharacter.toLowerCase();
      if (type === 'plot') plotCharacterCounts.plot++;
      else if (type === 'character') plotCharacterCounts.character++;
      else if (type === 'balanced') plotCharacterCounts.balanced++;
      else plotCharacterCounts.na++;
    });

    const plotOrCharacter = {
      plot: Math.round((plotCharacterCounts.plot / reviews.length) * 100),
      character: Math.round((plotCharacterCounts.character / reviews.length) * 100),
      balanced: Math.round((plotCharacterCounts.balanced / reviews.length) * 100),
      na: Math.round((plotCharacterCounts.na / reviews.length) * 100)
    };

    // Calculate character development
    const charDevCounts = {
      yes: 0,
      no: 0,
      complicated: 0,
      na: 0
    };

    reviews.forEach(review => {
      const dev = review.characterDevelopment.toLowerCase();
      if (dev === 'yes') charDevCounts.yes++;
      else if (dev === 'no') charDevCounts.no++;
      else if (dev === 'complicated') charDevCounts.complicated++;
      else charDevCounts.na++;
    });

    const characterDevelopment = {
      yes: Math.round((charDevCounts.yes / reviews.length) * 100),
      no: Math.round((charDevCounts.no / reviews.length) * 100),
      complicated: Math.round((charDevCounts.complicated / reviews.length) * 100),
      na: Math.round((charDevCounts.na / reviews.length) * 100)
    };

    // Calculate loveable characters
    const loveableCounts = {
      yes: 0,
      no: 0,
      complicated: 0,
      na: 0
    };

    reviews.forEach(review => {
      const loveable = review.charactersLoveable.toLowerCase();
      if (loveable === 'yes') loveableCounts.yes++;
      else if (loveable === 'no') loveableCounts.no++;
      else if (loveable === 'complicated') loveableCounts.complicated++;
      else loveableCounts.na++;
    });

    const loveableCharacters = {
      yes: Math.round((loveableCounts.yes / reviews.length) * 100),
      no: Math.round((loveableCounts.no / reviews.length) * 100),
      complicated: Math.round((loveableCounts.complicated / reviews.length) * 100),
      na: Math.round((loveableCounts.na / reviews.length) * 100)
    };

    // Calculate flaws focus
    const flawsCounts = {
      yes: 0,
      no: 0,
      complicated: 0,
      na: 0
    };

    reviews.forEach(review => {
      const flaws = review.flawsFocus.toLowerCase();
      if (flaws === 'yes') flawsCounts.yes++;
      else if (flaws === 'no') flawsCounts.no++;
      else if (flaws === 'complicated') flawsCounts.complicated++;
      else flawsCounts.na++;
    });

    const flawsFocus = {
      yes: Math.round((flawsCounts.yes / reviews.length) * 100),
      no: Math.round((flawsCounts.no / reviews.length) * 100),
      complicated: Math.round((flawsCounts.complicated / reviews.length) * 100),
      na: Math.round((flawsCounts.na / reviews.length) * 100)
    };

    // Calculate trigger warnings - FIXED: Use correct property name
    const triggerWarningCounts = {};
    reviews.forEach(review => {
      // Now using the correct alias 'TriggerWarnings'
      const triggerWarnings = review.TriggerWarnings || [];
      console.log(`Review ${review.id} trigger warnings:`, triggerWarnings.length);
      
      triggerWarnings.forEach(tw => {
        const twName = tw.name.toLowerCase().replace(/\s+/g, '_');
        triggerWarningCounts[twName] = (triggerWarningCounts[twName] || 0) + 1;
      });
    });

    console.log('Trigger warning counts:', triggerWarningCounts);

    const triggerWarnings = {};
    Object.entries(triggerWarningCounts).forEach(([tw, count]) => {
      triggerWarnings[tw] = Math.round((count / reviews.length) * 100);
    });

    // Get some sample reviews for display
    const sampleReviews = await Review.findAll({
      where: { bookId: book.id },
      include: [
        { 
          model: User, 
          attributes: ['id', 'username'] 
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    const formattedSampleReviews = sampleReviews.map(review => ({
      id: review.id,
      rating: review.rating,
      reviewText: review.reviewText.substring(0, 200) + (review.reviewText.length > 200 ? '...' : ''),
      username: review.User ? review.User.username : 'Anonymous',
      createdAt: review.createdAt
    }));

    console.log('Final response data:');
    console.log('Moods:', moods);
    console.log('Trigger warnings:', triggerWarnings);

    res.json({
      totalReviews: reviews.length,
      averageRating: Math.round(averageRating * 100) / 100,
      moods,
      pace,
      plotOrCharacter,
      characterDevelopment,
      loveableCharacters,
      flawsFocus,
      triggerWarnings,
      sampleReviews: formattedSampleReviews
    });
  } catch (error) {
    console.error('Error calculating review stats:', error);
    res.status(500).json({ message: 'Error calculating review stats', error: error.message });
  }
};

module.exports = {
    createReview,
    getAllReviews,
    getReviewById,
    updateReview,
    deleteReview,
    createOrUpdateReview,
    getReviewByBookAndUser,
    getReviewStats
}