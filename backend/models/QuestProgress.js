const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const QuestProgress = sequelize.define("QuestProgress", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    userChallengeId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'UserChallenges',
            key: 'id'
        }
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    progressCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    questId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'ChallengeQuests',
            key: 'id'
        }
    }
});

module.exports = QuestProgress;