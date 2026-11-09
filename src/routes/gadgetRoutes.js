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
 * tags:
 *   name: Gadgets
 *   description: IMF Gadget management endpoints
 */

/**
 * @swagger
 * /api/gadgets:
 *   get:
 *     tags: [Gadgets]
 *     summary: List gadgets, optionally filtered by status
 *     description: Returns gadgets newest first. Pass `status` to filter.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [Available, Deployed, Destroyed, Decommissioned]
 *         description: Only return gadgets with this status
 *     responses:
 *       200:
 *         description: List of gadgets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Number of gadgets returned
 *                 gadgets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Gadget'
 *       400:
 *         description: Invalid status parameter
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/', auth, getAllGadgets);

/**
 * @swagger
 * components:
 *   schemas:
 *     Gadget:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: "Laser Watch"
 *         codename:
 *           type: string
 *           example: "The Phoenix"
 *         status:
 *           type: string
 *           enum: [Available, Deployed, Destroyed, Decommissioned]
 *         missionSuccessProbability:
 *           type: number
 *           example: 85
 *         decommissionedAt:
 *           type: string
 *           format: date-time
 */

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
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Laser Watch"
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Missing or invalid name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Gadget'
 */
router.post('/', auth, createGadget);

/**
 * @swagger
 * /api/gadgets/{id}:
 *   patch:
 *     tags: [Gadgets]
 *     summary: Update a gadget's name and/or status
 *     description: Only `name` and `status` can be changed; other fields are rejected with 400.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Available, Deployed, Destroyed, Decommissioned]
 *     responses:
 *       200:
 *         description: Updated
 *       400:
 *         description: Invalid or unsupported fields
 *       404:
 *         description: Gadget not found
 */
router.patch('/:id', auth, updateGadget);

/**
 * @swagger
 * /api/gadgets/{id}:
 *   delete:
 *     tags: [Gadgets]
 *     summary: Decommission a gadget (soft delete)
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
 *         description: Gadget marked Decommissioned
 *       404:
 *         description: Gadget not found
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
 *         description: Self-destruct initiated; returns a confirmation code
 *       404:
 *         description: Gadget not found
 *       409:
 *         description: Gadget already destroyed
 */
router.post('/:id/self-destruct', auth, selfDestruct);

module.exports = router;