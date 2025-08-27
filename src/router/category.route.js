const express = require("express");
const categoryController = require("../controllers/category.controller");
const { validateId } = require("../middleware/validation");
const { authenticateToken, requireOwner } = require("../middleware/auth");
const { body } = require("express-validator");

const router = express.Router();

// Category validation
const validateCategory = [
	body("name")
		.notEmpty()
		.withMessage("Category name is required")
		.isLength({ min: 2, max: 100 })
		.withMessage("Category name must be between 2 and 100 characters")
		.trim(),

	body("description")
		.optional()
		.isLength({ max: 500 })
		.withMessage("Description must not exceed 500 characters")
		.trim(),

	body("parentCategory")
		.optional()
		.isMongoId()
		.withMessage("Invalid parent category ID"),

	body("properties")
		.optional()
		.isArray()
		.withMessage("Properties must be an array"),

	body("properties.*.name")
		.if(body("properties").exists())
		.notEmpty()
		.withMessage("Property name is required"),

	body("properties.*.type")
		.if(body("properties").exists())
		.isIn(["text", "number", "boolean", "select", "multiselect"])
		.withMessage("Invalid property type"),

	body("sortOrder").optional().isNumeric().withMessage("Sort order must be a number"),
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Category ID
 *         name:
 *           type: string
 *           description: Category name
 *         slug:
 *           type: string
 *           description: URL-friendly category name
 *         description:
 *           type: string
 *           description: Category description
 *         parentCategory:
 *           type: string
 *           description: Parent category ID
 *         properties:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, number, boolean, select, multiselect]
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               required:
 *                 type: boolean
 *               unit:
 *                 type: string
 *         isActive:
 *           type: boolean
 *         sortOrder:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get categories hierarchy
 *     description: Get all categories with their subcategories in hierarchical structure
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categories fetched successfully
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
 *                   example: "Categories fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get("/", categoryController.getAll);

/**
 * @swagger
 * /categories/flat:
 *   get:
 *     summary: Get flat list of categories
 *     description: Get paginated flat list of all categories
 *     tags: [Categories]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and description
 *     responses:
 *       200:
 *         description: Categories fetched successfully
 */
router.get("/flat", categoryController.getFlat);

/**
 * @swagger
 * /categories/initialize-mattress:
 *   post:
 *     summary: Initialize default mattress categories
 *     description: Create default mattress categories with properties (Owner only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories initialized successfully
 *       401:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post("/initialize-mattress", authenticateToken, requireOwner, categoryController.initializeMattressCategories);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create new category
 *     description: Create a new category (Owner only)
 *     tags: [Categories]
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
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Ortopedik Matras"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Orqa va bo'yin uchun maxsus ishlab chiqilgan matraslar"
 *               parentCategory:
 *                 type: string
 *                 description: Parent category ID
 *               properties:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [text, number, boolean, select, multiselect]
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                     required:
 *                       type: boolean
 *                     unit:
 *                       type: string
 *               sortOrder:
 *                 type: number
 *                 default: 0
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
router.post("/", authenticateToken, requireOwner, validateCategory, categoryController.create);

/**
 * @swagger
 * /categories/slug/{slug}:
 *   get:
 *     summary: Get category by slug
 *     description: Get category information by its slug
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         description: Category slug
 *         schema:
 *           type: string
 *           example: "ortopedik-matras"
 *     responses:
 *       200:
 *         description: Category fetched successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/slug/:slug", categoryController.getBySlug);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get single category
 *     description: Get category by ID with subcategories
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Category ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category fetched successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id", validateId, categoryController.getOne);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update category
 *     description: Update category information (Owner only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Category ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               properties:
 *                 type: array
 *                 items:
 *                   type: object
 *               sortOrder:
 *                 type: number
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put("/:id", authenticateToken, requireOwner, validateId, validateCategory, categoryController.update);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete category
 *     description: Delete category (soft delete, Owner only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Category ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         description: Cannot delete category with subcategories or used in posts
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete("/:id", authenticateToken, requireOwner, validateId, categoryController.delete);

module.exports = router;
