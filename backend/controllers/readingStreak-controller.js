const { User, ReadingStreak, ReadingStatus } = require('../models');
const { Op } = require('sequelize');

const updateStreak = async (req, res) => {
  const { userId } = req.params;
  const { pagesRead } = req.body;
  console.log(`Updating streak for user ${userId}`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  console.log('Today (server):', today);

  try {
    let streak = await ReadingStreak.findOne({
      where: { user_id: userId }
    });
    console.log('Found streak:', streak ? streak.get({ plain: true }) : null);

    if (!streak) {
      console.log('Creating new streak');
      streak = await ReadingStreak.create({
        current_streak: 1,
        last_activity_date: today,
        user_id: userId
      });
      return res.json({ streak, action: 'created' });
    }

    const lastActivity = new Date(streak.last_activity_date);
    lastActivity.setHours(0, 0, 0, 0);
    console.log('Last activity:', lastActivity);
    const diffDays = Math.floor((today - lastActivity) / (1000 * 3600 * 24));
    console.log('Days difference:', diffDays);
    
    let current_streak = streak.current_streak;
    
    if (diffDays === 0) {
      // Same day - don't change streak, just update
      console.log('Same day activity - streak remains:', current_streak);
    } else if (diffDays === 1) {
      // Consecutive day - increment streak
      current_streak += 1;
      console.log('Consecutive day - incrementing streak to:', current_streak);
    } else if (diffDays > 1) {
      // Gap in reading - reset streak to 1 (starting fresh)
      current_streak = 1;
      console.log('Gap detected - resetting streak to 1');
    }

    await streak.update({
      current_streak,
      last_activity_date: today
    });
    console.log('Streak updated successfully to:', current_streak);
    res.json({ streak, action: 'updated' });
  } catch (error) {
    console.error('Eroare:', error);
    res.status(500).json({ error: 'Eroare la actualizarea streak-ului' });
  }
};

const getStreak = async (req, res) => {
  const { userId } = req.params;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  try {
    const streak = await ReadingStreak.findOne({
      where: { user_id: userId }
    });

    let currentStreak = 0;
    
    if (streak) {
      const lastActivity = new Date(streak.last_activity_date);
      lastActivity.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - lastActivity) / (1000 * 3600 * 24));

      if (diffDays > 1) {
        // Streak is broken - but don't update the database here
        // Let updateStreak handle the reset when user actually reads
        currentStreak = 0;
        console.log('Streak broken - returning 0 but not updating DB');
      } else {
        // Streak is still valid (today or yesterday)
        currentStreak = streak.current_streak;
        console.log('Streak still valid:', currentStreak);
      }
    }

    // Get weekly reading activity for the visual indicators
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); 
    
    const readingActivities = await ReadingStatus.findAll({
      where: {
        user_id: userId,
        updatedAt: {
          [Op.gte]: startOfWeek
        },
        page_counter: {
          [Op.gt]: 0
        }
      }
    });

    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const activeDays = {};
    weekDays.forEach(day => {
      activeDays[day] = false;
    });

    readingActivities.forEach(activity => {
      const activityDate = new Date(activity.updatedAt);
      const dayName = weekDays[activityDate.getDay()];
      activeDays[dayName] = true;
    });

    res.json({ 
      current_streak: currentStreak,
      activeDays
    });
  } catch (error) {
    console.error('Eroare:', error);
    res.status(500).json({ error: 'Eroare la obținerea streak-ului' });
  }
};

module.exports = { 
  updateStreak,
  getStreak
};