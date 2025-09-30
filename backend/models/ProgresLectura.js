const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ReadingStatus = sequelize.define("ReadingStatus", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
    status:{
        type: DataTypes.ENUM('read', 'want_to_read', 'currently_reading', 'dnf'),
        allowNull: false
    },
    currently_reading_start_date:{
        type: DataTypes.DATE,
        allowNull: true
    },
    read_finish_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    pages: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    page_counter: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Users',
            key: 'id'
        }
    }, 
    book_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Books',
            key: 'id'
        }
    },
    ownedBookId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'OwnedBooks',
            key: 'id'
        },
        allowNull: true,
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    }    
});

module.exports = ReadingStatus;