const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserChallenge = sequelize.define("UserChallenge", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    challengeId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'ReadingChallenges',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'declined'),
        defaultValue: 'pending'
    }
});

module.exports = UserChallenge;