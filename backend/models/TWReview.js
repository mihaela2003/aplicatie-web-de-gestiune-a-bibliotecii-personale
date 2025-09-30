const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ReviewTriggerWarning = sequelize.define("ReviewTriggerWarning", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
    tw_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'TriggerWarnings',
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

module.exports = ReviewTriggerWarning;