const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TriggerWarning = sequelize.define("TriggerWarning", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true, 
      } 
});
module.exports = TriggerWarning;