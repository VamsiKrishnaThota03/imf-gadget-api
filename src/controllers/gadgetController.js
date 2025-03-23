const { Gadget } = require('../models');
const { generateCodename, generateConfirmationCode } = require('../utils/helpers');

// Valid status values
const VALID_STATUSES = ['Available', 'Deployed', 'Destroyed', 'Decommissioned'];

const getAllGadgets = async (req, res) => {
  try {
    const { status } = req.query;

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    // Build where clause based on status filter
    const where = status ? { status } : {};
    
    // Get gadgets with filter and sorting
    const gadgets = await Gadget.findAll({ 
      where,
      order: [['createdAt', 'DESC']]
    });

    // Return count with filtered gadgets
    res.json({
      count: gadgets.length,
      gadgets: gadgets.map(gadget => ({
        ...gadget.toJSON(),
        missionSuccessProbability: `${gadget.missionSuccessProbability}%`
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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