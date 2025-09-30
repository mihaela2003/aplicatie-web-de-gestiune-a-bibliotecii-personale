const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Genre = sequelize.define("Genre", {
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

module.exports = Genre;