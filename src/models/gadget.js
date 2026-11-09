const { randomUUID } = require('crypto');
const { randomSuccessProbability } = require('../utils/helpers');

const GADGET_STATUSES = ['Available', 'Deployed', 'Destroyed', 'Decommissioned'];

module.exports = (sequelize, DataTypes) => {
  const Gadget = sequelize.define('Gadget', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => randomUUID(),
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true, len: [1, 100] },
    },
    codename: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...GADGET_STATUSES),
      defaultValue: 'Available',
    },
    decommissionedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    missionSuccessProbability: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: randomSuccessProbability, // 60-100%
    },
  });

  Gadget.STATUSES = GADGET_STATUSES;

  return Gadget;
};
