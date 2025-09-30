const {DataTypes} = require("sequelize");
const sequelize = require("../config/database");

const OwnedBook = sequelize.define("OwnedBook", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
    type: {
        type: DataTypes.ENUM("Physical" , "Ebook", "Audiobook"),
        allowNull: false
    },
    language: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    date_owned: {
        type: DataTypes.DATE,
        allowNull: true
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

module.exports = OwnedBook;