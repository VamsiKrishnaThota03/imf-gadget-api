const { v4: uuidv4 } = require('uuid');
const { Gadget } = require('../models');
const { generateCodename, generateConfirmationCode } = require('../utils/helpers');

// Valid status values
const VALID_STATUSES = ['Available', 'Deployed', 'Destroyed', 'Decommissioned'];

const getAllGadgets = async (req, res) => {
  try {
    const { status } = req.query;

    // If no status provided, return all gadgets
    if (!status) {
      const gadgets = await Gadget.findAll();
      return res.json({
        count: gadgets.length,
        gadgets
      });
    }

    // Validate status if provided
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    // Get filtered gadgets
    const gadgets = await Gadget.findAll({
      where: { status },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      count: gadgets.length,
      gadgets
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching gadgets' });
  }
};

const createGadget = async (req, res) => {
  try {
    const gadget = await Gadget.create({
      ...req.body,
      codename: generateCodename(),
    });
    res.status(201).json(gadget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateGadget = async (req, res) => {
  try {
    const gadget = await Gadget.findByPk(req.params.id);
    if (!gadget) {
      return res.status(404).json({ message: 'Gadget not found' });
    }
    
    await gadget.update(req.body);
    res.json(gadget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteGadget = async (req, res) => {
  try {
    const gadget = await Gadget.findByPk(req.params.id);
    if (!gadget) {
      return res.status(404).json({ message: 'Gadget not found' });
    }
    
    await gadget.update({
      status: 'Decommissioned',
      decommissionedAt: new Date(),
    });
    res.json(gadget);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const selfDestruct = async (req, res) => {
  try {
    const gadget = await Gadget.findByPk(req.params.id);
    if (!gadget) {
      return res.status(404).json({ message: 'Gadget not found' });
    }

    const confirmationCode = generateConfirmationCode();
    
    await gadget.update({
      status: 'Destroyed',
    });
    
    res.json({
      message: 'Self-destruct sequence initiated',
      confirmationCode,
      gadget,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAllGadgets,
  createGadget,
  updateGadget,
  deleteGadget,
  selfDestruct,
}; 