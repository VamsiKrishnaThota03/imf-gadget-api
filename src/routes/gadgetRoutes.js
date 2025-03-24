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
 *     summary: Get all gadgets with optional status filter
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Available, Deployed, Destroyed, Decommissioned]
 *         required: false
 *         description: Filter gadgets by status
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
 *                   description: Total number of gadgets
 *                   example: 1
 *                 gadgets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "dd3d247a-98b3-44b3-802c-9ee228d41afb"
 *                       name:
 *                         type: string
 *                         example: "Exploding Pen"
 *                       codename:
 *                         type: string
 *                         example: "Operation Shadow"
 *                       status:
 *                         type: string
 *                         enum: [Available, Deployed, Destroyed, Decommissioned]
 *                         example: "Available"
 *                       decommissionedAt:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       missionSuccessProbability:
 *                         type: string
 *                         example: "100%"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid status parameter
 *       401:
 *         description: Unauthorized - Invalid or missing token
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