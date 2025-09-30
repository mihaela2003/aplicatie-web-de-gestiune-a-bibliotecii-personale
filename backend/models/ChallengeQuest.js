const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ChallengeQuest = sequelize.define("ChallengeQuest", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    prompt: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    type: { 
      type: DataTypes.ENUM('custom', 'book_based', 'genre_based', 'count_based'), 
      defaultValue: 'custom' 
    },
    targetCount: { 
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    challengeId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'ReadingChallenges',
            key: 'id'
        }
    }
});

module.exports = ChallengeQuest;