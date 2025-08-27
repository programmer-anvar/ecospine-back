const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const categorySchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			unique: true,
			maxlength: 100,
		},
		slug: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
			maxlength: 500,
		},
		parentCategory: {
			type: Schema.Types.ObjectId,
			ref: "Category",
			default: null,
		},
		properties: [
			{
				name: {
					type: String,
					required: true,
					trim: true,
				},
				type: {
					type: String,
					enum: ["text", "number", "boolean", "select", "multiselect"],
					required: true,
				},
				options: [String], // For select/multiselect types
				required: {
					type: Boolean,
					default: false,
				},
				unit: String, // For measurements like cm, kg, etc.
			},
		],
		isActive: {
			type: Boolean,
			default: true,
		},
		sortOrder: {
			type: Number,
			default: 0,
		},
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		updatedBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

// Add indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parentCategory: 1, isActive: 1 });
categorySchema.index({ sortOrder: 1, name: 1 });

// Add pagination plugin
categorySchema.plugin(mongoosePaginate);

// Generate slug from name
categorySchema.pre("save", function (next) {
	if (this.isModified("name")) {
		this.slug = this.name
			.toLowerCase()
			.trim()
			.replace(/[^\w\s-]/g, "")
			.replace(/[\s_-]+/g, "-")
			.replace(/^-+|-+$/g, "");
	}
	next();
});

// Virtual to get subcategories
categorySchema.virtual("subcategories", {
	ref: "Category",
	localField: "_id",
	foreignField: "parentCategory",
});

// Static method to get categories with subcategories
categorySchema.statics.getHierarchy = async function () {
	const categories = await this.find({ parentCategory: null, isActive: true })
		.populate({
			path: "subcategories",
			match: { isActive: true },
			options: { sort: { sortOrder: 1, name: 1 } },
		})
		.sort({ sortOrder: 1, name: 1 });

	return categories;
};

// Static method to find by slug
categorySchema.statics.findBySlug = function (slug) {
	return this.findOne({ slug, isActive: true }).populate("parentCategory");
};

module.exports = model("Category", categorySchema);
