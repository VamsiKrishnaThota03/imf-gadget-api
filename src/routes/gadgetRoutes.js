const express = require('express');
const auth = require('../middleware/auth');
const {
  getAllGadgets,
  createGadget,
  updateGadget,
  deleteGadget,
  selfDestruct,
} = require('../controllers/gadgetController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Gadget:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         codename:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Available, Deployed, Destroyed, Decommissioned]
 *         missionSuccessProbability:
 *           type: number
 */

/**
 * @swagger
 * /api/gadgets:
 *   get:
 *     summary: Get all gadgets
 *     tags: [Gadgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Available, Deployed, Destroyed, Decommissioned]
 *     responses:
 *       200:
 *         description: List of gadgets
 */
router.get('/', auth, getAllGadgets);
router.post('/', createGadget);
router.patch('/:id', updateGadget);
router.delete('/:id', deleteGadget);
router.post('/:id/self-destruct', selfDestruct);

module.exports = router; 