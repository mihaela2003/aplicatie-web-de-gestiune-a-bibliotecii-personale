const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ReadingStreak = sequelize.define("ReadingStreak", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    current_streak: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }, 
    last_activity_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
});

module.exports = ReadingStreak;