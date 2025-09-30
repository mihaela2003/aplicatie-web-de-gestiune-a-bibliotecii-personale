const {DataTypes} = require("sequelize");
const sequelize = require("../config/database");

const Book = sequelize.define("Book", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
    google_books_id: {
        type: DataTypes.STRING,
        unique: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    published_date: {
        type: DataTypes.DATE
    }
});

module.exports = Book;