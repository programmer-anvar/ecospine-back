const advancedPostService = require("../server/advancedPost.service");
const ActivityLog = require("../models/activityLog.model");
const { loggers } = require("../middleware/activityLogger");
const ApiResponse = require("../utils/response");

class AdvancedPostController {
    async getAll(req, res, next) {
        try {
            const options = {
                page: req.query.page || 1,
                limit: req.query.limit || 10,
                search: req.query.search || '',
                category: req.query.category || '',
                minPrice: req.query.minPrice || 0,
                maxPrice: req.query.maxPrice || 0,
                tags: req.query.tags || '',
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc',
                status: req.query.status || 'active',
                featured: req.query.featured || null
            };

            const result = await advancedPostService.getAll(options);
            
            return ApiResponse.success(res, result, "Posts fetched successfully");
        } catch (error) {
            console.error("Error fetching posts:", error);
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const image = req.files && req.files.image ? req.files.image : null;
            const post = await advancedPostService.create(req.body, image, req.user._id);
            
            // Log activity
            await ActivityLog.logActivity({
                user: req.user._id,
                action: 'POST_CREATED',
                resource: 'post',
                resourceId: post._id,
                details: {
                    title: post.title,
                    category: post.category,
                    hasImage: !!image
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            return ApiResponse.created(res, post, "Post created successfully");
        } catch (error) {
            console.error("Error creating post:", error);
            next(error);
        }
    }

    async getOne(req, res, next) {
        try {
            const { id } = req.params;
            const trackView = req.query.trackView === 'true';
            
            const post = await advancedPostService.getOne(id, trackView);
            
            if (!post) {
                return ApiResponse.notFound(res, "Post not found");
            }

            // Log view activity if tracking is enabled
            if (trackView && req.user) {
                await ActivityLog.logActivity({
                    user: req.user._id,
                    action: 'POST_VIEWED',
                    resource: 'post',
                    resourceId: post._id,
                    details: { title: post.title },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });
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
            const image = req.files && req.files.image ? req.files.image : null;

            const post = await advancedPostService.edit(updateData, id, req.user._id, image);

            if (!post) {
                return ApiResponse.notFound(res, "Post not found");
            }

            // Log activity
            await ActivityLog.logActivity({
                user: req.user._id,
                action: 'POST_UPDATED',
                resource: 'post',
                resourceId: post._id,
                details: {
                    title: post.title,
                    updatedFields: Object.keys(updateData),
                    hasNewImage: !!image
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            return ApiResponse.success(res, post, "Post updated successfully");
        } catch (error) {
            console.error("Error updating post:", error);
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const { hard = false } = req.query;

            let post;
            if (hard === 'true' && req.user.isOwner()) {
                // Only owner can hard delete
                post = await advancedPostService.hardDelete(id, req.user._id);
            } else {
                // Soft delete for moderators and owners
                post = await advancedPostService.delete(id, req.user._id);
            }
            
            if (!post) {
                return ApiResponse.notFound(res, "Post not found");
            }

            // Log activity
            await ActivityLog.logActivity({
                user: req.user._id,
                action: 'POST_DELETED',
                resource: 'post',
                resourceId: post._id,
                details: {
                    title: post.title,
                    deleteType: hard === 'true' ? 'hard' : 'soft'
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            return ApiResponse.success(res, post, "Post deleted successfully");
        } catch (error) {
            console.error("Error deleting post:", error);
            next(error);
        }
    }

    async restore(req, res, next) {
        try {
            const { id } = req.params;
            
            const post = await advancedPostService.restore(id, req.user._id);

            // Log activity
            await ActivityLog.logActivity({
                user: req.user._id,
                action: 'POST_UPDATED',
                resource: 'post',
                resourceId: post._id,
                details: {
                    title: post.title,
                    action: 'restored'
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            return ApiResponse.success(res, post, "Post restored successfully");
        } catch (error) {
            console.error("Error restoring post:", error);
            next(error);
        }
    }

    async toggleFeatured(req, res, next) {
        try {
            const { id } = req.params;
            
            const post = await advancedPostService.toggleFeatured(id, req.user._id);

            // Log activity
            await ActivityLog.logActivity({
                user: req.user._id,
                action: 'POST_UPDATED',
                resource: 'post',
                resourceId: post._id,
                details: {
                    title: post.title,
                    action: `featured: ${post.featured}`
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            return ApiResponse.success(res, post, `Post ${post.featured ? 'featured' : 'unfeatured'} successfully`);
        } catch (error) {
            console.error("Error toggling featured status:", error);
            next(error);
        }
    }

    async search(req, res, next) {
        try {
            const { q: searchTerm } = req.query;
            
            if (!searchTerm) {
                return ApiResponse.badRequest(res, "Search term is required");
            }

            const options = {
                category: req.query.category || '',
                minPrice: req.query.minPrice || 0,
                maxPrice: req.query.maxPrice || 0,
                page: req.query.page || 1,
                limit: req.query.limit || 10
            };

            const result = await advancedPostService.search(searchTerm, options);
            
            return ApiResponse.success(res, result, "Search results fetched successfully");
        } catch (error) {
            console.error("Error searching posts:", error);
            next(error);
        }
    }

    async getStatistics(req, res, next) {
        try {
            const stats = await advancedPostService.getStatistics();
            
            return ApiResponse.success(res, stats, "Statistics fetched successfully");
        } catch (error) {
            console.error("Error fetching statistics:", error);
            next(error);
        }
    }

    // Get categories
    async getCategories(req, res, next) {
        try {
            const categories = [
                { value: 'electronics', label: 'Electronics' },
                { value: 'clothing', label: 'Clothing' },
                { value: 'books', label: 'Books' },
                { value: 'home', label: 'Home & Garden' },
                { value: 'sports', label: 'Sports' },
                { value: 'other', label: 'Other' }
            ];
            
            return ApiResponse.success(res, categories, "Categories fetched successfully");
        } catch (error) {
            console.error("Error fetching categories:", error);
            next(error);
        }
    }

    // Get user's activity logs
    async getUserActivities(req, res, next) {
        try {
            const options = {
                page: req.query.page || 1,
                limit: req.query.limit || 20,
                action: req.query.action || null,
                resource: req.query.resource || null,
                startDate: req.query.startDate || null,
                endDate: req.query.endDate || null
            };

            const result = await ActivityLog.getUserActivities(req.user._id, options);
            
            return ApiResponse.success(res, result, "User activities fetched successfully");
        } catch (error) {
            console.error("Error fetching user activities:", error);
            next(error);
        }
    }

    // Get system activities (owner only)
    async getSystemActivities(req, res, next) {
        try {
            if (!req.user.isOwner()) {
                return ApiResponse.forbidden(res, "Owner access required");
            }

            const options = {
                page: req.query.page || 1,
                limit: req.query.limit || 50,
                action: req.query.action || null,
                resource: req.query.resource || null,
                startDate: req.query.startDate || null,
                endDate: req.query.endDate || null,
                userId: req.query.userId || null
            };

            const result = await ActivityLog.getSystemActivities(options);
            
            return ApiResponse.success(res, result, "System activities fetched successfully");
        } catch (error) {
            console.error("Error fetching system activities:", error);
            next(error);
        }
    }
}

module.exports = new AdvancedPostController();
