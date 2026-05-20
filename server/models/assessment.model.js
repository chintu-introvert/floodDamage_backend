const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Assessment = sequelize.define('Assessment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  latitude: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cond: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  total_chickens: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  photos: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  synced_at: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  userId: {
    type: DataTypes.STRING(36),
    allowNull: true,
    field: 'user_id'
  }
}, {
  tableName: 'assessments',
  timestamps: false
});

module.exports = Assessment;
