const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Gadget = sequelize.define('Gadget', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    codename: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Available', 'Deployed', 'Destroyed', 'Decommissioned'),
      defaultValue: 'Available',
    },
    decommissionedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    missionSuccessProbability: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: () => Math.floor(Math.random() * 41) + 60, // 60-100%
    },
  });

  return Gadget;
}; 