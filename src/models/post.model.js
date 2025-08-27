const {Schema,model} = require('mongoose');

const postSchema = new Schema(
	{
		title: { type: String, required: true, trim: true },
		body: { type: String, required: true, trim: true },
		image: { type: String, default: null },
		price: { type: Number, required: true, min: 0 },
	},
	{
		timestamps: true, // Adds createdAt and updatedAt automatically
	}
);

module.exports = model("Post", postSchema)

