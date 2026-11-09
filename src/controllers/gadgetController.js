const { UniqueConstraintError } = require('sequelize');
const { Gadget } = require('../models');
const {
  generateCodename,
  generateTaggedCodename,
  generateConfirmationCode,
  isUuid,
} = require('../utils/helpers');

const VALID_STATUSES = Gadget.STATUSES;
const UPDATABLE_FIELDS = ['name', 'status'];
const MAX_CODENAME_ATTEMPTS = 8;

const validateName = (name) =>
  typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 100;

/** Load the gadget for :id or answer 404 (invalid UUIDs are treated as not found). */
const findGadgetOr404 = async (req, res) => {
  if (!isUuid(req.params.id)) {
    res.status(404).json({ message: 'Gadget not found' });
    return null;
  }
  const gadget = await Gadget.findByPk(req.params.id);
  if (!gadget) {
    res.status(404).json({ message: 'Gadget not found' });
    return null;
  }
  return gadget;
};

const getAllGadgets = async (req, res, next) => {
  try {
    const { status } = req.query;

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const gadgets = await Gadget.findAll({
      where: status ? { status } : undefined,
      order: [['createdAt', 'DESC']],
    });

    return res.json({ count: gadgets.length, gadgets });
  } catch (error) {
    return next(error);
  }
};

const createGadget = async (req, res, next) => {
  const { name } = req.body || {};
  if (!validateName(name)) {
    return res.status(400).json({ message: 'name is required (1-100 characters)' });
  }

  try {
    // Retry on codename collisions; switch to tagged codenames after a few attempts.
    for (let attempt = 0; attempt < MAX_CODENAME_ATTEMPTS; attempt += 1) {
      const codename = attempt < 3 ? generateCodename() : generateTaggedCodename();
      try {
        // eslint-disable-next-line no-await-in-loop
        const gadget = await Gadget.create({ name: name.trim(), codename });
        return res.status(201).json(gadget);
      } catch (error) {
        if (!(error instanceof UniqueConstraintError)) throw error;
      }
    }
    return res.status(503).json({ message: 'Could not allocate a unique codename, try again' });
  } catch (error) {
    return next(error);
  }
};

const updateGadget = async (req, res, next) => {
  const body = req.body || {};
  const unknown = Object.keys(body).filter((key) => !UPDATABLE_FIELDS.includes(key));
  if (unknown.length > 0) {
    return res.status(400).json({
      message: `Unsupported field(s): ${unknown.join(', ')}. Updatable: ${UPDATABLE_FIELDS.join(', ')}`,
    });
  }
  if (Object.keys(body).length === 0) {
    return res.status(400).json({ message: `Provide at least one of: ${UPDATABLE_FIELDS.join(', ')}` });
  }
  if (body.name !== undefined && !validateName(body.name)) {
    return res.status(400).json({ message: 'name must be 1-100 characters' });
  }
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  try {
    const gadget = await findGadgetOr404(req, res);
    if (!gadget) return undefined;

    const changes = {};
    if (body.name !== undefined) changes.name = body.name.trim();
    if (body.status !== undefined) {
      changes.status = body.status;
      // Keep decommissionedAt consistent with the status.
      if (body.status === 'Decommissioned' && !gadget.decommissionedAt) {
        changes.decommissionedAt = new Date();
      } else if (body.status !== 'Decommissioned') {
        changes.decommissionedAt = null;
      }
    }

    await gadget.update(changes);
    return res.json(gadget);
  } catch (error) {
    return next(error);
  }
};

const deleteGadget = async (req, res, next) => {
  try {
    const gadget = await findGadgetOr404(req, res);
    if (!gadget) return undefined;

    await gadget.update({
      status: 'Decommissioned',
      decommissionedAt: gadget.decommissionedAt || new Date(),
    });
    return res.json(gadget);
  } catch (error) {
    return next(error);
  }
};

const selfDestruct = async (req, res, next) => {
  try {
    const gadget = await findGadgetOr404(req, res);
    if (!gadget) return undefined;

    if (gadget.status === 'Destroyed') {
      return res.status(409).json({ message: 'Gadget has already been destroyed' });
    }

    const confirmationCode = generateConfirmationCode();
    await gadget.update({ status: 'Destroyed' });

    return res.json({
      message: 'Self-destruct sequence initiated',
      confirmationCode,
      gadget,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllGadgets,
  createGadget,
  updateGadget,
  deleteGadget,
  selfDestruct,
};
