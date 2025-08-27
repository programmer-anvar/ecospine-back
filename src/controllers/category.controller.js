const Category = require("../models/category.model");
const ApiResponse = require("../utils/response");
const ActivityLog = require("../models/activityLog.model");

class CategoryController {
	// Get all categories with hierarchy
	async getAll(req, res, next) {
		try {
			const categories = await Category.getHierarchy();
			return ApiResponse.success(
				res,
				categories,
				"Categories fetched successfully"
			);
		} catch (error) {
			console.error("Error fetching categories:", error);
			next(error);
		}
	}

	// Get flat list of categories
	async getFlat(req, res, next) {
		try {
			const { page = 1, limit = 50, search = "" } = req.query;

			const query = { isActive: true };
			if (search) {
				query.$or = [
					{ name: { $regex: search, $options: "i" } },
					{ description: { $regex: search, $options: "i" } },
				];
			}

			const result = await Category.paginate(query, {
				page: parseInt(page),
				limit: parseInt(limit),
				sort: { sortOrder: 1, name: 1 },
				populate: "parentCategory",
			});

			return ApiResponse.success(
				res,
				result,
				"Categories fetched successfully"
			);
		} catch (error) {
			console.error("Error fetching categories:", error);
			next(error);
		}
	}

	// Get single category
	async getOne(req, res, next) {
		try {
			const { id } = req.params;

			const category = await Category.findOne({ _id: id, isActive: true })
				.populate("parentCategory")
				.populate({
					path: "subcategories",
					match: { isActive: true },
				});

			if (!category) {
				return ApiResponse.notFound(res, "Category not found");
			}

			return ApiResponse.success(
				res,
				category,
				"Category fetched successfully"
			);
		} catch (error) {
			console.error("Error fetching category:", error);
			next(error);
		}
	}

	// Get category by slug
	async getBySlug(req, res, next) {
		try {
			const { slug } = req.params;

			const category = await Category.findBySlug(slug).populate({
				path: "subcategories",
				match: { isActive: true },
			});

			if (!category) {
				return ApiResponse.notFound(res, "Category not found");
			}

			return ApiResponse.success(
				res,
				category,
				"Category fetched successfully"
			);
		} catch (error) {
			console.error("Error fetching category:", error);
			next(error);
		}
	}

	// Create category (Owner only)
	async create(req, res, next) {
		try {
			const categoryData = {
				...req.body,
				createdBy: req.user._id,
			};

			const category = new Category(categoryData);
			await category.save();

			// Log activity
			await ActivityLog.logActivity({
				user: req.user._id,
				action: "USER_CREATED",
				resource: "category",
				resourceId: category._id,
				details: {
					name: category.name,
					slug: category.slug,
				},
				ipAddress: req.ip,
				userAgent: req.get("User-Agent"),
			});

			return ApiResponse.created(
				res,
				category,
				"Category created successfully"
			);
		} catch (error) {
			console.error("Error creating category:", error);
			next(error);
		}
	}

	// Update category (Owner only)
	async update(req, res, next) {
		try {
			const { id } = req.params;
			const updateData = {
				...req.body,
				updatedBy: req.user._id,
			};

			const category = await Category.findOneAndUpdate(
				{ _id: id, isActive: true },
				updateData,
				{ new: true, runValidators: true }
			);

			if (!category) {
				return ApiResponse.notFound(res, "Category not found");
			}

			// Log activity
			await ActivityLog.logActivity({
				user: req.user._id,
				action: "USER_UPDATED",
				resource: "category",
				resourceId: category._id,
				details: {
					name: category.name,
					updatedFields: Object.keys(updateData),
				},
				ipAddress: req.ip,
				userAgent: req.get("User-Agent"),
			});

			return ApiResponse.success(
				res,
				category,
				"Category updated successfully"
			);
		} catch (error) {
			console.error("Error updating category:", error);
			next(error);
		}
	}

	// Delete category (Owner only)
	async delete(req, res, next) {
		try {
			const { id } = req.params;

			// Check if category has subcategories
			const subcategories = await Category.countDocuments({
				parentCategory: id,
				isActive: true,
			});

			if (subcategories > 0) {
				return ApiResponse.badRequest(
					res,
					"Cannot delete category with subcategories"
				);
			}

			// Check if category is used in posts
			const Post = require("../models/post.model");
			const postsCount = await Post.countDocuments({
				category: id,
				status: { $ne: "deleted" },
			});

			if (postsCount > 0) {
				return ApiResponse.badRequest(
					res,
					"Cannot delete category that is used in posts"
				);
			}

			const category = await Category.findOneAndUpdate(
				{ _id: id, isActive: true },
				{ isActive: false, updatedBy: req.user._id },
				{ new: true }
			);

			if (!category) {
				return ApiResponse.notFound(res, "Category not found");
			}

			// Log activity
			await ActivityLog.logActivity({
				user: req.user._id,
				action: "USER_UPDATED",
				resource: "category",
				resourceId: category._id,
				details: {
					name: category.name,
					action: "deleted",
				},
				ipAddress: req.ip,
				userAgent: req.get("User-Agent"),
			});

			return ApiResponse.success(
				res,
				category,
				"Category deleted successfully"
			);
		} catch (error) {
			console.error("Error deleting category:", error);
			next(error);
		}
	}

	// Initialize default mattress categories
	async initializeMattressCategories(req, res, next) {
		try {
			if (!req.user.isOwner()) {
				return ApiResponse.forbidden(res, "Owner access required");
			}

			const defaultCategories = [
				{
					name: "Ortopedik Matras",
					description: "Orqa va bo'yin uchun maxsus ishlab chiqilgan matraslar",
					properties: [
						{
							name: "firmness",
							type: "select",
							options: ["yumshoq", "o'rtacha", "qattiq"],
							required: true,
						},
						{
							name: "material",
							type: "select",
							options: ["latex", "memory foam", "spring", "hybrid"],
							required: true,
						},
						{
							name: "thickness",
							type: "number",
							unit: "cm",
							required: true,
						},
						{
							name: "support_zones",
							type: "number",
							required: false,
						},
					],
					createdBy: req.user._id,
				},
				{
					name: "Memory Foam Matras",
					description: "Xotira ko'pikli matraslar, tanani qamrab oluvchi",
					properties: [
						{
							name: "density",
							type: "number",
							unit: "kg/m³",
							required: true,
						},
						{
							name: "firmness",
							type: "select",
							options: ["yumshoq", "o'rtacha", "qattiq"],
							required: true,
						},
						{
							name: "cooling_technology",
							type: "boolean",
							required: false,
						},
						{
							name: "thickness",
							type: "number",
							unit: "cm",
							required: true,
						},
					],
					createdBy: req.user._id,
				},
				{
					name: "Spring Matras",
					description: "An'anaviy prujinali matraslar",
					properties: [
						{
							name: "spring_type",
							type: "select",
							options: ["pocket", "bonnell", "continuous"],
							required: true,
						},
						{
							name: "spring_count",
							type: "number",
							required: true,
						},
						{
							name: "firmness",
							type: "select",
							options: ["yumshoq", "o'rtacha", "qattiq"],
							required: true,
						},
						{
							name: "pillow_top",
							type: "boolean",
							required: false,
						},
					],
					createdBy: req.user._id,
				},
				{
					name: "Latex Matras",
					description: "Tabiiy yoki sun'iy latex matraslar",
					properties: [
						{
							name: "latex_type",
							type: "select",
							options: ["natural", "synthetic", "blended"],
							required: true,
						},
						{
							name: "firmness",
							type: "select",
							options: ["yumshoq", "o'rtacha", "qattiq"],
							required: true,
						},
						{
							name: "perforations",
							type: "boolean",
							required: false,
						},
						{
							name: "thickness",
							type: "number",
							unit: "cm",
							required: true,
						},
					],
					createdBy: req.user._id,
				},
				{
					name: "Bolalar Matrasi",
					description: "Bolalar uchun maxsus ishlab chiqilgan matraslar",
					properties: [
						{
							name: "age_group",
							type: "select",
							options: ["chaqaloq", "bolakay", "maktabgacha", "maktab"],
							required: true,
						},
						{
							name: "hypoallergenic",
							type: "boolean",
							required: true,
						},
						{
							name: "waterproof",
							type: "boolean",
							required: false,
						},
						{
							name: "firmness",
							type: "select",
							options: ["yumshoq", "o'rtacha", "qattiq"],
							required: true,
						},
					],
					createdBy: req.user._id,
				},
			];

			const createdCategories = [];
			for (const categoryData of defaultCategories) {
				// Check if category already exists
				const existing = await Category.findOne({
					name: categoryData.name,
				});

				if (!existing) {
					const category = new Category(categoryData);
					await category.save();
					createdCategories.push(category);
				}
			}

			return ApiResponse.success(
				res,
				{
					created: createdCategories,
					total: createdCategories.length,
				},
				"Mattress categories initialized successfully"
			);
		} catch (error) {
			console.error("Error initializing categories:", error);
			next(error);
		}
	}
}

module.exports = new CategoryController();
