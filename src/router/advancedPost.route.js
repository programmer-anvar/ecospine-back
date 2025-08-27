const express = require('express');
const advancedPostController = require('../controllers/advancedPost.controller');
const {
	validatePost,
	validatePostUpdate,
	validateId,
} = require("../middleware/validation");
const { uploadLimiter } = require("../middleware/security");
const { authenticateToken, requireModerator, requireOwner, optionalAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AdvancedPost:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Post ID
 *         title:
 *           type: string
 *           description: Post title
 *         body:
 *           type: string
 *           description: Post content
 *         price:
 *           type: number
 *           description: Product price
 *         category:
 *           type: string
 *           enum: [electronics, clothing, books, home, sports, other]
 *           description: Post category
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Post tags
 *         status:
 *           type: string
 *           enum: [active, inactive, deleted]
 *           description: Post status
 *         views:
 *           type: number
 *           description: View count
 *         featured:
 *           type: boolean
 *           description: Featured status
 *         image:
 *           type: string
 *           description: Image filename
 *         imageUrl:
 *           type: string
 *           description: Image URL
 *         createdBy:
 *           $ref: '#/components/schemas/User'
 *         updatedBy:
 *           $ref: '#/components/schemas/User'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     PaginatedPosts:
 *       type: object
 *       properties:
 *         posts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdvancedPost'
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             totalPosts:
 *               type: integer
 *             hasNextPage:
 *               type: boolean
 *             hasPrevPage:
 *               type: boolean
 *             limit:
 *               type: integer
 *         filters:
 *           type: object
 *           description: Applied filters
 */

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts with advanced filtering
 *     description: Retrieve paginated posts with search, filtering, and sorting
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of posts per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title, body, or tags
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [electronics, clothing, books, home, sports, other]
 *         description: Filter by category
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price filter
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, price, views, title]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter by featured status
 *     responses:
 *       200:
 *         description: Posts fetched successfully
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
 *                   $ref: '#/components/schemas/PaginatedPosts'
 */
router.get("/", optionalAuth, advancedPostController.getAll);

/**
 * @swagger
 * /posts/search:
 *   get:
 *     summary: Search posts
 *     description: Advanced search functionality
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category filter
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Search term required
 */
router.get("/search", advancedPostController.search);

/**
 * @swagger
 * /posts/categories:
 *   get:
 *     summary: Get available categories
 *     description: Get list of available post categories
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: Categories fetched successfully
 */
router.get("/categories", advancedPostController.getCategories);

/**
 * @swagger
 * /posts/statistics:
 *   get:
 *     summary: Get post statistics
 *     description: Get comprehensive post statistics (Owner only)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics fetched successfully
 *       401:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get("/statistics", authenticateToken, requireOwner, advancedPostController.getStatistics);

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     description: Create a new post with enhanced features (Moderator/Owner only)
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
 *               body:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: Post content
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Product price
 *               category:
 *                 type: string
 *                 enum: [electronics, clothing, books, home, sports, other]
 *                 description: Post category
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *               featured:
 *                 type: boolean
 *                 description: Featured status
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Product image (optional, max 10MB)
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
router.post("/", authenticateToken, requireModerator, uploadLimiter, validatePost, advancedPostController.create);

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get a single post
 *     description: Retrieve a specific post by its ID with optional view tracking
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Post ID
 *         schema:
 *           type: string
 *       - in: query
 *         name: trackView
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Track view count
 *     responses:
 *       200:
 *         description: Post fetched successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id", optionalAuth, validateId, advancedPostController.getOne);

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post
 *     description: Update an existing post with enhanced features (Moderator/Owner only)
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
 *               body:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               price:
 *                 type: number
 *                 minimum: 0
 *               category:
 *                 type: string
 *                 enum: [electronics, clothing, books, home, sports, other]
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *               featured:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put("/:id", authenticateToken, requireModerator, uploadLimiter, validateId, validatePostUpdate, advancedPostController.edit);

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     description: Delete a post (soft delete by default, hard delete for owners)
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
 *       - in: query
 *         name: hard
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Hard delete (owner only)
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete("/:id", authenticateToken, requireModerator, validateId, advancedPostController.delete);

/**
 * @swagger
 * /posts/{id}/restore:
 *   patch:
 *     summary: Restore a deleted post
 *     description: Restore a soft-deleted post (Moderator/Owner only)
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
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch("/:id/restore", authenticateToken, requireModerator, validateId, advancedPostController.restore);

/**
 * @swagger
 * /posts/{id}/toggle-featured:
 *   patch:
 *     summary: Toggle featured status
 *     description: Toggle post featured status (Moderator/Owner only)
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
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch("/:id/toggle-featured", authenticateToken, requireModerator, validateId, advancedPostController.toggleFeatured);

/**
 * @swagger
 * /posts/activities/user:
 *   get:
 *     summary: Get user's post activities
 *     description: Get current user's activity log
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *         description: Filter by resource type
 *     responses:
 *       200:
 *         description: User activities fetched successfully
 */
router.get("/activities/user", authenticateToken, advancedPostController.getUserActivities);

/**
 * @swagger
 * /posts/activities/system:
 *   get:
 *     summary: Get system activities
 *     description: Get all system activities (Owner only)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: System activities fetched successfully
 *       403:
 *         description: Owner access required
 */
router.get("/activities/system", authenticateToken, requireOwner, advancedPostController.getSystemActivities);

module.exports = router;
