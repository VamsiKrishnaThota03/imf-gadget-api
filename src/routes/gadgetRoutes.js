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
 * /api/gadgets:
 *   get:
 *     tags: [Gadgets]
 *     summary: Get all gadgets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', auth, getAllGadgets);

/**
 * @swagger
 * /api/gadgets:
 *   post:
 *     tags: [Gadgets]
 *     summary: Create a new gadget
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Laser Watch"
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', auth, createGadget);

/**
 * @swagger
 * /api/gadgets/{id}:
 *   patch:
 *     tags: [Gadgets]
 *     summary: Update gadget status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Available, Deployed, Destroyed, Decommissioned]
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch('/:id', auth, updateGadget);

/**
 * @swagger
 * /api/gadgets/{id}:
 *   delete:
 *     tags: [Gadgets]
 *     summary: Delete a gadget
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/:id', auth, deleteGadget);

/**
 * @swagger
 * /api/gadgets/{id}/self-destruct:
 *   post:
 *     tags: [Gadgets]
 *     summary: Self destruct a gadget
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Self-destruct initiated
 */
router.post('/:id/self-destruct', auth, selfDestruct);

module.exports = router;