const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ReadingChallenge = sequelize.define("ReadingChallenge", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    startDate: {
        type: DataTypes.DATEONLY
    },
    endDate: {
        type: DataTypes.DATEONLY
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
});

module.exports = ReadingChallenge;