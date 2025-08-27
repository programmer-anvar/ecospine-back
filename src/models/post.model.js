const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const postSchema = new Schema(
	{
		title: { type: String, required: true, trim: true },
		body: { type: String, required: true, trim: true },
		image: { type: String, default: null },
		price: { type: Number, required: true, min: 0 },
		category: {
			type: Schema.Types.ObjectId,
			ref: "Category",
			required: true,
		},
		categoryProperties: {
			type: Map,
			of: Schema.Types.Mixed,
			default: new Map(),
		},
		tags: [{ type: String, trim: true }],
		status: {
			type: String,
			enum: ["active", "inactive", "deleted"],
			default: "active",
		},
		views: { type: Number, default: 0 },
		featured: { type: Boolean, default: false },
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
		timestamps: true, // Adds createdAt and updatedAt automatically
	}
);

// Add text index for search
postSchema.index({
	title: "text",
	body: "text",
	tags: "text",
});

// Add compound indexes for better query performance
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ category: 1, status: 1 });
postSchema.index({ price: 1, status: 1 });
postSchema.index({ featured: 1, status: 1, createdAt: -1 });
postSchema.index({ "categoryProperties.firmness": 1, status: 1 });
postSchema.index({ "categoryProperties.material": 1, status: 1 });

// Add pagination plugin
postSchema.plugin(mongoosePaginate);

// Virtual for image URL
postSchema.virtual("imageUrl").get(function () {
	if (this.image) {
		return `/api/v1/static/${this.image}`;
	}
	return null;
});

// Ensure virtual fields are serialized
postSchema.set("toJSON", { virtuals: true });

module.exports = model("Post", postSchema);
