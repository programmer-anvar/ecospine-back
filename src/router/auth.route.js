const express = require('express');
const authController = require('../controllers/auth.controller');
const { 
    validateLogin, 
    validateCreateModerator, 
    validateUpdateModerator 
} = require('../middleware/authValidation');
const { validateId } = require('../middleware/validation');
const { 
    authenticateToken, 
    requireOwner, 
    requireUserManagement 
} = require('../middleware/auth');
const { strictLimiter } = require('../middleware/security');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *         username:
 *           type: string
 *           description: Username
 *         email:
 *           type: string
 *           description: Email address
 *         fullName:
 *           type: string
 *           description: Full name
 *         role:
 *           type: string
 *           enum: [owner, moderator]
 *           description: User role
 *         isActive:
 *           type: boolean
 *           description: Account status
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login for owner and moderators
 *     description: Authenticate user and get JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username or email
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 description: Password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/login', strictLimiter, validateLogin, authController.login);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Get authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @swagger
 * /auth/moderators:
 *   post:
 *     summary: Create new moderator (Owner only)
 *     description: Create a new moderator account
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: "moderator1"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "moderator@ecospine.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "Password123"
 *               fullName:
 *                 type: string
 *                 maxLength: 100
 *                 example: "John Doe"
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/moderators', authenticateToken, requireUserManagement, validateCreateModerator, authController.createModerator);

/**
 * @swagger
 * /auth/moderators:
 *   get:
 *     summary: Get all moderators (Owner only)
 *     description: Retrieve list of all moderators
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       401:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/moderators', authenticateToken, requireUserManagement, authController.getModerators);

/**
 * @swagger
 * /auth/moderators/{id}:
 *   put:
 *     summary: Update moderator (Owner only)
 *     description: Update moderator information
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Moderator ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               fullName:
 *                 type: string
 *                 maxLength: 100
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/moderators/:id', authenticateToken, requireUserManagement, validateId, validateUpdateModerator, authController.updateModerator);

/**
 * @swagger
 * /auth/moderators/{id}/deactivate:
 *   patch:
 *     summary: Deactivate moderator (Owner only)
 *     description: Deactivate a moderator account
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Moderator ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       401:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/moderators/:id/deactivate', authenticateToken, requireUserManagement, validateId, authController.deactivateModerator);

/**
 * @swagger
 * /auth/moderators/{id}/activate:
 *   patch:
 *     summary: Activate moderator (Owner only)
 *     description: Activate a moderator account
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Moderator ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       401:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/moderators/:id/activate', authenticateToken, requireUserManagement, validateId, authController.activateModerator);

/**
 * @swagger
 * /auth/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics (Owner only)
 *     description: Get system statistics for dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Dashboard stats fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         totalModerators:
 *                           type: integer
 *                         activeModerators:
 *                           type: integer
 *                         inactiveModerators:
 *                           type: integer
 *                     posts:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get('/dashboard/stats', authenticateToken, requireOwner, authController.getDashboardStats);

module.exports = router;
