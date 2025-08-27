const postModel = require("../models/post.model");
const fileService = require("./file.service");

class PostService {
	async create(post, image) {
		try {
			let postData = { ...post };

			if (image) {
				const fileName = fileService.save(image);
				postData.image = fileName;
			}

			const newPost = await postModel.create(postData);
			return newPost;
		} catch (error) {
			throw new Error(`Error creating post: ${error.message}`);
		}
	}

	async getAll() {
		try {
			const allPosts = await postModel.find().sort({ createdAt: -1 });
			return allPosts;
		} catch (error) {
			throw new Error(`Error fetching posts: ${error.message}`);
		}
	}

	async getOne(id) {
		try {
			if (!id) {
				throw new Error("Post ID is required");
			}
			const post = await postModel.findById(id);
			return post;
		} catch (error) {
			throw new Error(`Error fetching post: ${error.message}`);
		}
	}

	async edit(post, id) {
		try {
			if (!id) {
				throw new Error("Post ID is required");
			}
			const updatedData = await postModel.findByIdAndUpdate(id, post, {
				new: true,
			});
			return updatedData;
		} catch (error) {
			throw new Error(`Error updating post: ${error.message}`);
		}
	}

	async updateWithImage(id, post, image) {
		try {
			if (!id) {
				throw new Error("Post ID is required");
			}

			// Get existing post to delete old image if needed
			const existingPost = await postModel.findById(id);
			if (!existingPost) {
				throw new Error("Post not found");
			}

			let updateData = { ...post };

			if (image) {
				// Delete old image if exists
				if (existingPost.image) {
					try {
						fileService.delete(existingPost.image);
					} catch (deleteError) {
						console.warn(
							"Could not delete old image:",
							deleteError.message
						);
					}
				}

				// Save new image
				const fileName = fileService.save(image);
				updateData.image = fileName;
			}

			const updatedData = await postModel.findByIdAndUpdate(
				id,
				updateData,
				{ new: true }
			);
			return updatedData;
		} catch (error) {
			throw new Error(`Error updating post with image: ${error.message}`);
		}
	}

	async delete(id) {
		try {
			if (!id) {
				throw new Error("Post ID is required");
			}

			// Get post to delete associated image
			const post = await postModel.findById(id);
			if (post && post.image) {
				try {
					fileService.delete(post.image);
				} catch (deleteError) {
					console.warn(
						"Could not delete image file:",
						deleteError.message
					);
				}
			}

			const deletedPost = await postModel.findByIdAndDelete(id);
			return deletedPost;
		} catch (error) {
			throw new Error(`Error deleting post: ${error.message}`);
		}
	}
}

module.exports = new PostService();
