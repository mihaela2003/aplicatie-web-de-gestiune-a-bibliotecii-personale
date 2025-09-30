const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const QuestBook = sequelize.define("QuestBook", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    questId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'ChallengeQuests',
            key: 'id'
        }
    },
    bookId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Books',
            key: 'id'
        }
    },
    addedBy: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
});

module.exports = QuestBook;