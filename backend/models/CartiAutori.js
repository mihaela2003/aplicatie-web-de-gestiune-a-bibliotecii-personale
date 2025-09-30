const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BookAuthor = sequelize.define("BookAuthor", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
    book_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Books',
            key: 'id'
        }
    }, 
    author_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Authors',
            key: 'id'
        }
    }
});

module.exports = BookAuthor;