
import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

// Achievement patches with correct public folder paths
const ACHIEVEMENT_PATCHES = {
  // Reading Streak patches
  'streak_1': '/images/achievements/first_step_1_day.png',
  'streak_7': '/images/achievements/week_warrior_7_days.png', 
  'streak_30': '/images/achievements/montly_reader_30_days.png',
  'streak_100': '/images/achievements/century_club_100_days.png',
  'streak_180': '/images/achievements/half_a_year_hero_180_days_1.png',
  'streak_365': '/images/achievements/year_long_legend_365_days.png',
  
  // Books Read patches
  'books_1': '/images/achievements/first_book_1_book.png',
  'books_10': '/images/achievements/bookworm_10_books.png',
  'books_25': '/images/achievements/reading_enthusiast_25_books.png',
  'books_50': '/images/achievements/book_collector_50_books_1.png',
  'books_100': '/images/achievements/century_reader_100_books.png',
  'books_200': '/images/achievements/library_master_200_books.png',
  
  // Genre patches
  'genre_1': '/images/achievements/genre_explorer_1_genre.png',
  'genre_5': '/images/achievements/diverse_reader_5_genres.png',
  'genre_10': '/images/achievements/genre_connoisseur_10_genres_1.png',
  'genre_20': '/images/achievements/literary_omnivore_20_genres_1.png'
};

const Achievements = () => {
  // Get user ID from JWT token
  const getUserId = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        return decoded.id || decoded.userId;
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  };

  const userId = getUserId();
  
  const [achievements, setAchievements] = useState({ 
    earned: [], 
    next: {}, 
    total: { earned: 0, available: 0 } 
  });
  const [progress, setProgress] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentValues, setCurrentValues] = useState({
    streak: 0,
    books: 0,
    genres: 0
  });

  // Achievement definitions with patch references
  const ACHIEVEMENT_DEFINITIONS = {
    readingStreak: [
      { id: 'streak_1', name: 'First Steps', description: 'Read for 1 day', threshold: 1, patch: 'streak_1', category: 'streak' },
      { id: 'streak_7', name: 'Week Warrior', description: 'Read for 7 consecutive days', threshold: 7, patch: 'streak_7', category: 'streak' },
      { id: 'streak_30', name: 'Monthly Reader', description: 'Read for 30 consecutive days', threshold: 30, patch: 'streak_30', category: 'streak' },
      { id: 'streak_100', name: 'Century Club', description: 'Read for 100 consecutive days', threshold: 100, patch: 'streak_100', category: 'streak' },
      { id: 'streak_180', name: 'Half Year Hero', description: 'Read for 6 months straight', threshold: 180, patch: 'streak_180', category: 'streak' },
      { id: 'streak_365', name: 'Year-Long Legend', description: 'Read for 365 consecutive days', threshold: 365, patch: 'streak_365', category: 'streak' }
    ],
    booksRead: [
      { id: 'books_1', name: 'First Book', description: 'Complete your first book', threshold: 1, patch: 'books_1', category: 'books' },
      { id: 'books_10', name: 'Bookworm', description: 'Read 10 books', threshold: 10, patch: 'books_10', category: 'books' },
      { id: 'books_25', name: 'Reading Enthusiast', description: 'Read 25 books', threshold: 25, patch: 'books_25', category: 'books' },
      { id: 'books_50', name: 'Book Collector', description: 'Read 50 books', threshold: 50, patch: 'books_50', category: 'books' },
      { id: 'books_100', name: 'Century Reader', description: 'Read 100 books', threshold: 100, patch: 'books_100', category: 'books' },
      { id: 'books_200', name: 'Library Master', description: 'Read 200 books', threshold: 200, patch: 'books_200', category: 'books' }
    ],
    genres: [
      { id: 'genre_1', name: 'Genre Explorer', description: 'Read from 1 different genre', threshold: 1, patch: 'genre_1', category: 'genres' },
      { id: 'genre_5', name: 'Diverse Reader', description: 'Read from 5 different genres', threshold: 5, patch: 'genre_5', category: 'genres' },
      { id: 'genre_10', name: 'Genre Connoisseur', description: 'Read from 10 different genres', threshold: 10, patch: 'genre_10', category: 'genres' },
      { id: 'genre_20', name: 'Literary Omnivore', description: 'Read from 20 different genres', threshold: 20, patch: 'genre_20', category: 'genres' }
    ]
  };

  // Fetch reading streak data
  const fetchReadingStreak = async () => {
    try {
      const streakResponse = await axios.get(`http://localhost:3001/api/readingStreak/${userId}`);
      return streakResponse.data.current_streak || 0;
    } catch (error) {
      console.error('Error fetching reading streak:', error);
      return 0;
    }
  };

  // Fetch books read data
  const fetchBooksRead = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/readingstatuses/user/${userId}`);
      const readBooks = response.data.filter(book => book.status === 'read');
      return { count: readBooks.length, books: readBooks };
    } catch (error) {
      console.error('Error fetching books read:', error);
      return { count: 0, books: [] };
    }
  };

  // Fetch genre diversity data
  const fetchGenreDiversity = async (readBooks) => {
    const genreCounter = {};
    const uniqueGenres = new Set();

    await Promise.all(
      readBooks.map(async (book) => {
        try {
          const res = await axios.get(`https://www.googleapis.com/books/v1/volumes/${book.google_books_id}`);
          const info = res.data.volumeInfo;

          // Process genres - take top 3 from each book
          if (info.categories) {
            const bookGenres = info.categories
              .flatMap(category => category.split('/').map(genre => genre.trim()))
              .filter(genre => genre && genre !== 'Unknown')
              .slice(0, 3); // Take top 3 genres per book

            bookGenres.forEach(genre => {
              const primaryGenre = genre.split(' ')[0]; // Get the main genre word
              genreCounter[primaryGenre] = (genreCounter[primaryGenre] || 0) + 1;
              uniqueGenres.add(primaryGenre);
            });
          }
        } catch (err) {
          console.error(`Error processing book ${book.google_books_id}:`, err);
        }
      })
    );

    return uniqueGenres.size;
  };

  // Calculate earned achievements based on current values
  const calculateEarnedAchievements = (streak, booksCount, genresCount) => {
    const earned = [];
    
    // Check reading streak achievements
    ACHIEVEMENT_DEFINITIONS.readingStreak.forEach(achievement => {
      if (streak >= achievement.threshold) {
        earned.push(achievement);
      }
    });

    // Check books read achievements
    ACHIEVEMENT_DEFINITIONS.booksRead.forEach(achievement => {
      if (booksCount >= achievement.threshold) {
        earned.push(achievement);
      }
    });

    // Check genre diversity achievements
    ACHIEVEMENT_DEFINITIONS.genres.forEach(achievement => {
      if (genresCount >= achievement.threshold) {
        earned.push(achievement);
      }
    });

    return earned;
  };

  // Find next achievements for each category
  const findNextAchievements = (streak, booksCount, genresCount) => {
    const next = {};

    // Next streak achievement
    const nextStreak = ACHIEVEMENT_DEFINITIONS.readingStreak.find(
      achievement => streak < achievement.threshold
    );
    if (nextStreak) next.streak = nextStreak;

    // Next books achievement
    const nextBooks = ACHIEVEMENT_DEFINITIONS.booksRead.find(
      achievement => booksCount < achievement.threshold
    );
    if (nextBooks) next.books = nextBooks;

    // Next genre achievement
    const nextGenres = ACHIEVEMENT_DEFINITIONS.genres.find(
      achievement => genresCount < achievement.threshold
    );
    if (nextGenres) next.genres = nextGenres;

    return next;
  };

  // Main data fetching function
  const fetchAchievementsData = async () => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [streakData, booksData] = await Promise.all([
        fetchReadingStreak(),
        fetchBooksRead()
      ]);

      // Fetch genre diversity based on read books
      const genresCount = await fetchGenreDiversity(booksData.books);

      // Update current values
      const values = {
        streak: streakData,
        books: booksData.count,
        genres: genresCount
      };
      setCurrentValues(values);

      // Calculate earned achievements
      const earnedAchievements = calculateEarnedAchievements(
        values.streak,
        values.books,
        values.genres
      );

      // Find next achievements
      const nextAchievements = findNextAchievements(
        values.streak,
        values.books,
        values.genres
      );

      // Calculate total available achievements
      const totalAvailable = Object.values(ACHIEVEMENT_DEFINITIONS).reduce(
        (sum, categoryAchievements) => sum + categoryAchievements.length,
        0
      );

      setAchievements({
        earned: earnedAchievements,
        next: nextAchievements,
        total: { 
          earned: earnedAchievements.length, 
          available: totalAvailable 
        },
        currentValues: values
      });

    } catch (error) {
      console.error('Error fetching achievements data:', error);
      setError('Failed to load achievements data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAchievementsData();
  }, [userId]);

  useEffect(() => {
    if (selectedCategory !== 'all') {
      calculateCategoryProgress(selectedCategory);
    }
  }, [selectedCategory, achievements, currentValues]);

  const calculateCategoryProgress = (category) => {
    let currentValue = 0;
    let achievementList = [];
    
    switch (category) {
      case 'streak':
        currentValue = currentValues.streak;
        achievementList = ACHIEVEMENT_DEFINITIONS.readingStreak;
        break;
      case 'books':
        currentValue = currentValues.books;
        achievementList = ACHIEVEMENT_DEFINITIONS.booksRead;
        break;
      case 'genres':
        currentValue = currentValues.genres;
        achievementList = ACHIEVEMENT_DEFINITIONS.genres;
        break;
      default:
        return;
    }
    
    const progressData = achievementList.map(achievement => ({
      ...achievement,
      earned: currentValue >= achievement.threshold,
      progress: Math.min((currentValue / achievement.threshold) * 100, 100),
      current: currentValue
    }));
    
    setProgress(prev => ({ 
      ...prev, 
      [category]: { 
        category, 
        progress: progressData, 
        currentValue,
        categoryName: category.charAt(0).toUpperCase() + category.slice(1)
      } 
    }));
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'streak': return '🔥';
      case 'books': return '📚';
      case 'genres': return '🎭';
      default: return '🏆';
    }
  };

  const getCategoryName = (category) => {
    switch (category) {
      case 'streak': return 'Reading Streak';
      case 'books': return 'Books Read';
      case 'genres': return 'Genre Diversity';
      default: return 'All';
    }
  };

  // Custom patch component with grayscale effect for locked achievements
  const AchievementPatch = ({ achievement, isEarned = true, size = 'large' }) => {
    const patchSrc = ACHIEVEMENT_PATCHES[achievement.patch];
    const sizeClass = size === 'small' ? 'achievement-patch-small' : 'achievement-patch-large';
    
    return (
      <div className={`achievement-patch ${sizeClass} ${!isEarned ? 'achievement-patch-locked' : ''}`}>
        {patchSrc ? (
          <img 
            src={patchSrc} 
            alt={achievement.name}
            className="patch-image"
          />
        ) : (
          <div className="patch-placeholder">
            🏆
          </div>
        )}
      </div>
    );
  };

  const renderAchievementCard = (achievement, isEarned = true) => (
    <div key={achievement.id} className={`achievement-card ${isEarned ? 'earned' : 'locked'}`}>
      <AchievementPatch achievement={achievement} isEarned={isEarned} />
      <div className="achievement-info">
        <h3>{achievement.name}</h3>
        <p>{achievement.description}</p>
        {!isEarned && achievement.threshold && (
          <div className="achievement-threshold">
            Unlock at: {achievement.threshold}
          </div>
        )}
      </div>
      {isEarned && (
        <div className="achievement-earned-badge">
          ✓
        </div>
      )}
    </div>
  );

  const renderProgressBar = (current, target, label) => {
    const percentage = Math.min((current / target) * 100, 100);
    return (
      <div className="progress-container">
        <div className="progress-label">
          <span>{label}</span>
          <span>{current}/{target}</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="progress-percentage">{Math.round(percentage)}%</div>
      </div>
    );
  };

  const renderCategoryProgress = (categoryData) => {
    if (!categoryData) return null;

    return (
      <div className="category-progress">
        <h3>
          {getCategoryIcon(categoryData.category)} 
          {getCategoryName(categoryData.category)} Progress
        </h3>
        <div className="progress-grid">
          {categoryData.progress.map(item => (
            <div key={item.id} className={`progress-item ${item.earned ? 'earned' : 'locked'}`}>
              <div className="progress-item-header">
                <AchievementPatch achievement={item} isEarned={item.earned} size="small" />
                <div className="progress-item-info">
                  <span className="progress-name">{item.name}</span>
                  {item.earned && <span className="earned-check">✓</span>}
                </div>
              </div>
              <p className="progress-description">{item.description}</p>
              {!item.earned && renderProgressBar(item.current, item.threshold, 'Progress')}
              {item.earned && (
                <div className="earned-message">
                  🎉 Achievement Unlocked!
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!userId) {
    return (
      <div className="achievements-container">
        <div className="error">
          <span className="error-icon">🔐</span>
          <span>Please log in to view your achievements</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="achievements-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>Loading achievements...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="achievements-container">
        <div className="error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={fetchAchievementsData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='main-content'>
      <div className="achievements-container">
        <div className="achievements-header">
          <h2>Your Reading Achievements</h2>
          <div className="achievements-stats">
            <div className="stat-item">
              <span className="stat-value">{achievements.total.earned}</span>
              <span className="stat-label">Earned</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{achievements.total.available}</span>
              <span className="stat-label">Available</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{currentValues.streak}</span>
              <span className="stat-label">Current Streak</span>
            </div>
          </div>
        </div>

        <div className="achievements-content">
         {selectedCategory === 'all' ? (
  <>
    {achievements.earned.length > 0 && (
      <div className="earned-achievements">
        <h2>Unlocked Achievements ({achievements.earned.length})</h2>
        <div className="achievements-grid">
          {achievements.earned.map(achievement => renderAchievementCard(achievement, true))}
        </div>
      </div>
    )}
    <div className="category-section">
      <h2>Reading Streak Achievements</h2>
      <div className="achievements-grid">
        {ACHIEVEMENT_DEFINITIONS.readingStreak.map(achievement => {
          const isEarned = achievements.earned.some(earned => earned.id === achievement.id);
          return renderAchievementCard(achievement, isEarned);
        })}
      </div>
    </div>

    <div className="category-section">
      <h2>Books Read Achievements</h2>
      <div className="achievements-grid">
        {ACHIEVEMENT_DEFINITIONS.booksRead.map(achievement => {
          const isEarned = achievements.earned.some(earned => earned.id === achievement.id);
          return renderAchievementCard(achievement, isEarned);
        })}
      </div>
    </div>

    <div className="category-section">
      <h2>Genre Diversity Achievements</h2>
      <div className="achievements-grid">
        {ACHIEVEMENT_DEFINITIONS.genres.map(achievement => {
          const isEarned = achievements.earned.some(earned => earned.id === achievement.id);
          return renderAchievementCard(achievement, isEarned);
        })}
      </div>
    </div>
  </>
) : (
  progress[selectedCategory] && renderCategoryProgress(progress[selectedCategory])
)}
        </div>
      </div>
      
      <style jsx>{`
        .achievement-patch {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 15px;
          transition: all 0.3s ease;
        }
        
        .achievement-patch-large {
          width: 80px;
          height: 80px;
          margin-right: 20px;
          min-width: 80px;
        }
        
        .achievement-patch-small {
          width: 50px;
          height: 50px;
          margin-right: 15px;
          min-width: 50px;
        }
        
        .patch-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 15px;
          transition: all 0.3s ease;
        }
        
        .achievement-patch-locked .patch-image {
          filter: grayscale(100%) brightness(0.6);
          opacity: 0.7;
        }
        
        .achievement-patch-locked:hover .patch-image {
          filter: grayscale(80%) brightness(0.8);
          opacity: 0.9;
        }
        
        .patch-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 15px;
          font-size: 2rem;
          color: white;
        }
        
        .achievement-card {
          display: flex;
          align-items: center;
          padding: 15px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          border: 2px solid transparent;
        }
        
        .achievement-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57);
        }
        
        .achievement-card.earned {
          background: linear-gradient(135deg, #f0fff4 0%, #dcfce7 100%);
          border-color: #22c55e;
          box-shadow: 0 8px 25px rgba(34, 197, 94, 0.2);
        }
        
        .achievement-card.earned::before {
          background: linear-gradient(90deg, #22c55e, #16a34a);
        }
        
        .achievement-card.locked {
          background: rgba(248, 250, 252, 0.8);
          border-color: #e2e8f0;
          opacity: 0.8;
        }
        
        .achievement-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 15px 40px rgba(0,0,0,0.2);
        }
        
        .progress-item-header {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .progress-item-info {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .progress-name {
          font-weight: 700;
          color: #2d3748;
          font-size: 1.3rem;
        }
        
        .earned-check {
          color: #22c55e;
          font-size: 1.5rem;
          font-weight: bold;
        }
        
        @media (max-width: 768px) {
          .achievement-patch-large {
            width: 60px;
            height: 60px;
            margin-right: 15px;
            min-width: 60px;
          }
          
          .achievement-patch-small {
            width: 40px;
            height: 40px;
            margin-right: 12px;
            min-width: 40px;
          }
          
          .achievement-card {
            padding: 20px;
          }
        }
        
        @media (max-width: 480px) {
          .achievement-card {
            flex-direction: column;
            text-align: center;
            padding: 25px 20px;
          }
          
          .achievement-patch-large {
            margin-right: 0;
            margin-bottom: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default Achievements;