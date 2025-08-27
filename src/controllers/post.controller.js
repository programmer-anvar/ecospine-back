const postService = require("../server/post.service");
const ApiResponse = require("../utils/response");

class PostController {
	async getAll(req, res, next) {
		try {
			const allPosts = await postService.getAll();
			return ApiResponse.success(
				res,
				allPosts,
				"Posts fetched successfully"
			);
		} catch (error) {
			console.error("Error fetching posts:", error);
			next(error);
		}
	}

	async create(req, res, next) {
		try {
			const image = req.files && req.files.image ? req.files.image : null;
			const post = await postService.create(req.body, image);

			return ApiResponse.created(res, post, "Post created successfully");
		} catch (error) {
			console.error("Error creating post:", error);
			next(error);
		}
	}

	async getOne(req, res, next) {
		try {
			const { id } = req.params;
			const post = await postService.getOne(id);

			if (!post) {
				return ApiResponse.notFound(res, "Post not found");
			}

			return ApiResponse.success(res, post, "Post fetched successfully");
		} catch (error) {
			console.error("Error fetching post:", error);
			next(error);
		}
	}

	async edit(req, res, next) {
		try {
			const { id } = req.params;
			const updateData = req.body;

			// Handle image update if provided
			const image = req.files && req.files.image ? req.files.image : null;
			let post;

			if (image) {
				post = await postService.updateWithImage(id, updateData, image);
			} else {
				post = await postService.edit(updateData, id);
			}

			if (!post) {
				return ApiResponse.notFound(res, "Post not found");
			}

			return ApiResponse.success(res, post, "Post updated successfully");
		} catch (error) {
			console.error("Error updating post:", error);
			next(error);
		}
	}

	async delete(req, res, next) {
		try {
			const { id } = req.params;
			const post = await postService.delete(id);

			if (!post) {
				return ApiResponse.notFound(res, "Post not found");
			}

			return ApiResponse.success(res, post, "Post deleted successfully");
		} catch (error) {
			console.error("Error deleting post:", error);
			next(error);
		}
	}
}

module.exports = new PostController();
