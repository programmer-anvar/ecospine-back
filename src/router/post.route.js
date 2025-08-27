const express = require('express');
const postController = require('../controllers/post.controller');
const {
	validatePost,
	validatePostUpdate,
	validateId,
} = require("../middleware/validation");
const { uploadLimiter } = require("../middleware/security");
const {
	authenticateToken,
	requireModerator,
	optionalAuth,
} = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts
 *     description: Retrieve a list of all posts with optional pagination
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
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
 *                   example: "Posts fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/", optionalAuth, postController.getAll);

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     description: Create a new post with optional image upload (Moderator/Owner only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - body
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Post title
 *                 example: "Amazing Product"
 *               body:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: Post content
 *                 example: "This is an amazing product with great features..."
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Product price
 *                 example: 99.99
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Product image (optional, max 10MB)
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
	"/",
	authenticateToken,
	requireModerator,
	uploadLimiter,
	validatePost,
	postController.create
);

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get a single post
 *     description: Retrieve a specific post by its ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Post ID
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/:id", optionalAuth, validateId, postController.getOne);

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post
 *     description: Update an existing post with optional image upload (Moderator/Owner only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Post ID
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Post title
 *                 example: "Updated Product Title"
 *               body:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: Post content
 *                 example: "Updated product description..."
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Product price
 *                 example: 89.99
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Product image (optional, max 10MB)
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put(
	"/:id",
	authenticateToken,
	requireModerator,
	uploadLimiter,
	validateId,
	validatePostUpdate,
	postController.edit
);

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     description: Delete a specific post and its associated image (Moderator/Owner only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Post ID
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete(
	"/:id",
	authenticateToken,
	requireModerator,
	validateId,
	postController.delete
);

module.exports = router;