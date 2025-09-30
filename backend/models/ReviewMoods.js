const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ReviewMoods = sequelize.define("ReviewMoods", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
    mood_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Mood',
            key: 'id'
        }
    },
    review_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Reviews',
            key: 'id'
        }
    }
});

module.exports = ReviewMoods;