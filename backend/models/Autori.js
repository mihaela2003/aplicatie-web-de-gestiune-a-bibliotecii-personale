const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Author = sequelize.define("Author", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
      }
});

module.exports = Author;