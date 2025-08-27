const { body, param, validationResult } = require('express-validator');

// Validation middleware to handle errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// Post validation rules
const validatePost = [
	body("title")
		.notEmpty()
		.withMessage("Title is required")
		.isLength({ min: 3, max: 100 })
		.withMessage("Title must be between 3 and 100 characters")
		.trim(),

	body("body")
		.notEmpty()
		.withMessage("Body is required")
		.isLength({ min: 10, max: 1000 })
		.withMessage("Body must be between 10 and 1000 characters")
		.trim(),

	body("price")
		.notEmpty()
		.withMessage("Price is required")
		.isNumeric()
		.withMessage("Price must be a number")
		.isFloat({ min: 0 })
		.withMessage("Price must be a positive number"),

	body("category")
		.notEmpty()
		.withMessage("Category is required")
		.isMongoId()
		.withMessage("Invalid category ID"),

	body("categoryProperties")
		.optional()
		.isObject()
		.withMessage("Category properties must be an object"),

	body("tags")
		.optional()
		.custom((value) => {
			if (typeof value === "string") {
				return true; // Will be processed in controller
			}
			if (Array.isArray(value)) {
				return value.every(
					(tag) => typeof tag === "string" && tag.trim().length > 0
				);
			}
			return false;
		})
		.withMessage("Tags must be a string or array of strings"),

	body("featured")
		.optional()
		.isBoolean()
		.withMessage("Featured must be a boolean value"),

	handleValidationErrors,
];

// Post update validation (optional fields)
const validatePostUpdate = [
	body("title")
		.optional()
		.isLength({ min: 3, max: 100 })
		.withMessage("Title must be between 3 and 100 characters")
		.trim(),

	body("body")
		.optional()
		.isLength({ min: 10, max: 1000 })
		.withMessage("Body must be between 10 and 1000 characters")
		.trim(),

	body("price")
		.optional()
		.isNumeric()
		.withMessage("Price must be a number")
		.isFloat({ min: 0 })
		.withMessage("Price must be a positive number"),

	body("category").optional().isMongoId().withMessage("Invalid category ID"),

	body("categoryProperties")
		.optional()
		.isObject()
		.withMessage("Category properties must be an object"),

	body("tags")
		.optional()
		.custom((value) => {
			if (typeof value === "string") {
				return true; // Will be processed in controller
			}
			if (Array.isArray(value)) {
				return value.every(
					(tag) => typeof tag === "string" && tag.trim().length > 0
				);
			}
			return false;
		})
		.withMessage("Tags must be a string or array of strings"),

	body("featured")
		.optional()
		.isBoolean()
		.withMessage("Featured must be a boolean value"),

	body("status")
		.optional()
		.isIn(["active", "inactive"])
		.withMessage("Status must be active or inactive"),

	handleValidationErrors,
];

// ID validation
const validateId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid ID format'),
    
    handleValidationErrors
];

module.exports = {
    validatePost,
    validatePostUpdate,
    validateId,
    handleValidationErrors
};
