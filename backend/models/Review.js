const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Review = sequelize.define("Review", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2), 
    allowNull: false,
    validate: {
      min: 0,
      max: 5,
    },
  },
  bookPacing: {
    type: DataTypes.ENUM("Slow", "Medium", "Fast"),
    allowNull: false,
  },
  plotOrCharacter: {
    type: DataTypes.ENUM("Plot", "Character", "Balanced", "N/A"),
    allowNull: false,
    defaultValue: "N/A"
  },
  characterDevelopment: {
    type: DataTypes.ENUM("Yes", "No", "Complicated", "N/A"),
    allowNull: false,
    defaultValue: "N/A"
  },
  charactersLoveable: {
    type: DataTypes.ENUM("Yes", "No", "Complicated", "N/A"),
    allowNull: false,
    defaultValue: "N/A"
  },
  flawsFocus: {
    type: DataTypes.ENUM("Yes", "No", "Complicated", "N/A"),
    allowNull: false,
    defaultValue: "N/A"
  },
  reviewText: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Users",
      key: "id",
    },
  },
  bookId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Books",
      key: "id",
    },
  },
});

module.exports = Review;