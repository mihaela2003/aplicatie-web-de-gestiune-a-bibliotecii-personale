const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BookGenre = sequelize.define("BookGenre", {
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
    genre_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Genres',
            key: 'id'
        }
    }
});

module.exports = BookGenre;