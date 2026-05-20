const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SyncHistory = sequelize.define('SyncHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  successful: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  failed: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  total: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    field: 'user_id'
  }
}, {
  tableName: 'sync_histories',
  timestamps: false
});

module.exports = SyncHistory;
