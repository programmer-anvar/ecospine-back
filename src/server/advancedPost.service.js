const postModel = require("../models/post.model");
const enhancedFileService = require("./enhancedFile.service");

class AdvancedPostService {
    // Get all posts with advanced filtering and pagination
    async getAll(options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                category = '',
                minPrice = 0,
                maxPrice = 0,
                tags = '',
                sortBy = 'createdAt',
                sortOrder = 'desc',
                status = 'active',
                featured = null
            } = options;

            // Build query
            const query = { status };

            // Search functionality
            if (search) {
                query.$text = { $search: search };
            }

            // Category filter
            if (category && category !== 'all') {
                query.category = category;
            }

            // Price range filter
            if (minPrice > 0 || maxPrice > 0) {
                query.price = {};
                if (minPrice > 0) query.price.$gte = minPrice;
                if (maxPrice > 0) query.price.$lte = maxPrice;
            }

            // Tags filter
            if (tags) {
                const tagArray = tags.split(',').map(tag => tag.trim());
                query.tags = { $in: tagArray };
            }

            // Featured filter
            if (featured !== null) {
                query.featured = featured === 'true';
            }

            // Pagination options
            const paginateOptions = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
                populate: [
                    {
                        path: 'createdBy',
                        select: 'username fullName role'
                    },
                    {
                        path: 'updatedBy',
                        select: 'username fullName role'
                    }
                ]
            };

            // Add text search score for sorting if searching
            if (search) {
                paginateOptions.sort = { score: { $meta: 'textScore' }, createdAt: -1 };
            }

            const result = await postModel.paginate(query, paginateOptions);

            return {
                posts: result.docs,
                pagination: {
                    currentPage: result.page,
                    totalPages: result.totalPages,
                    totalPosts: result.totalDocs,
                    hasNextPage: result.hasNextPage,
                    hasPrevPage: result.hasPrevPage,
                    limit: result.limit
                },
                filters: {
                    search,
                    category,
                    minPrice,
                    maxPrice,
                    tags,
                    sortBy,
                    sortOrder,
                    status,
                    featured
                }
            };
        } catch (error) {
            throw new Error(`Error fetching posts: ${error.message}`);
        }
    }

    // Create post with enhanced features
    async create(postData, image, userId) {
        try {
            let fileInfo = null;
            
            if (image) {
                fileInfo = await enhancedFileService.save(image, {
                    thumbnailSize: { width: 300, height: 300 }
                });
            }

            // Parse tags if string
            if (typeof postData.tags === 'string') {
                postData.tags = postData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            }

            const newPost = await postModel.create({
                ...postData,
                image: fileInfo ? fileInfo.fileName : null,
                createdBy: userId
            });

            // Populate creator info
            await newPost.populate('createdBy', 'username fullName role');

            return {
                ...newPost.toJSON(),
                imageInfo: fileInfo
            };
        } catch (error) {
            // Cleanup uploaded file if post creation fails
            if (image && fileInfo) {
                try {
                    await enhancedFileService.delete(fileInfo.fileName);
                } catch (cleanupError) {
                    console.error('File cleanup error:', cleanupError);
                }
            }
            throw new Error(`Error creating post: ${error.message}`);
        }
    }

    // Get single post with view tracking
    async getOne(id, trackView = false) {
        try {
            if (!id) {
                throw new Error("Post ID is required");
            }

            const post = await postModel.findOne({ _id: id, status: { $ne: 'deleted' } })
                .populate('createdBy', 'username fullName role')
                .populate('updatedBy', 'username fullName role');

            if (!post) {
                return null;
            }

            // Track view if requested
            if (trackView) {
                post.views += 1;
                await post.save();
            }

            return post;
        } catch (error) {
            throw new Error(`Error fetching post: ${error.message}`);
        }
    }

    // Update post with enhanced features
    async edit(postData, id, userId, image = null) {
        try {
            if (!id) {
                throw new Error("Post ID is required");
            }

            const existingPost = await postModel.findOne({ _id: id, status: { $ne: 'deleted' } });
            if (!existingPost) {
                throw new Error("Post not found");
            }

            let updateData = { ...postData, updatedBy: userId };

            // Parse tags if string
            if (typeof updateData.tags === 'string') {
                updateData.tags = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            }

            // Handle image update
            if (image) {
                // Save new image
                const fileInfo = await enhancedFileService.save(image, {
                    thumbnailSize: { width: 300, height: 300 }
                });

                // Delete old image if exists
                if (existingPost.image) {
                    try {
                        await enhancedFileService.delete(existingPost.image);
                    } catch (deleteError) {
                        console.warn("Could not delete old image:", deleteError.message);
                    }
                }

                updateData.image = fileInfo.fileName;
                updateData.imageInfo = fileInfo;
            }

            const updatedPost = await postModel.findByIdAndUpdate(
                id, 
                updateData, 
                { new: true, runValidators: true }
            )
            .populate('createdBy', 'username fullName role')
            .populate('updatedBy', 'username fullName role');

            return updatedPost;
        } catch (error) {
            throw new Error(`Error updating post: ${error.message}`);
        }
    }

    // Soft delete post
    async delete(id, userId) {
        try {
            if (!id) {
                throw new Error("Post ID is required");
            }

            const post = await postModel.findOne({ _id: id, status: { $ne: 'deleted' } });
            if (!post) {
                return null;
            }

            // Soft delete - just change status
            const deletedPost = await postModel.findByIdAndUpdate(
                id,
                { 
                    status: 'deleted',
                    updatedBy: userId
                },
                { new: true }
            )
            .populate('createdBy', 'username fullName role')
            .populate('updatedBy', 'username fullName role');

            return deletedPost;
        } catch (error) {
            throw new Error(`Error deleting post: ${error.message}`);
        }
    }

    // Hard delete post (completely remove from database)
    async hardDelete(id, userId) {
        try {
            if (!id) {
                throw new Error("Post ID is required");
            }

            const post = await postModel.findById(id);
            if (!post) {
                return null;
            }

            // Delete associated image
            if (post.image) {
                try {
                    await enhancedFileService.delete(post.image);
                } catch (deleteError) {
                    console.warn("Could not delete image file:", deleteError.message);
                }
            }

            // Delete from database
            const deletedPost = await postModel.findByIdAndDelete(id);
            return deletedPost;
        } catch (error) {
            throw new Error(`Error hard deleting post: ${error.message}`);
        }
    }

    // Restore soft deleted post
    async restore(id, userId) {
        try {
            if (!id) {
                throw new Error("Post ID is required");
            }

            const post = await postModel.findOne({ _id: id, status: 'deleted' });
            if (!post) {
                throw new Error("Deleted post not found");
            }

            const restoredPost = await postModel.findByIdAndUpdate(
                id,
                { 
                    status: 'active',
                    updatedBy: userId
                },
                { new: true }
            )
            .populate('createdBy', 'username fullName role')
            .populate('updatedBy', 'username fullName role');

            return restoredPost;
        } catch (error) {
            throw new Error(`Error restoring post: ${error.message}`);
        }
    }

    // Toggle featured status
    async toggleFeatured(id, userId) {
        try {
            const post = await postModel.findOne({ _id: id, status: { $ne: 'deleted' } });
            if (!post) {
                throw new Error("Post not found");
            }

            const updatedPost = await postModel.findByIdAndUpdate(
                id,
                { 
                    featured: !post.featured,
                    updatedBy: userId
                },
                { new: true }
            )
            .populate('createdBy', 'username fullName role')
            .populate('updatedBy', 'username fullName role');

            return updatedPost;
        } catch (error) {
            throw new Error(`Error toggling featured status: ${error.message}`);
        }
    }

    // Get post statistics
    async getStatistics() {
        try {
            const [
                totalPosts,
                activePosts,
                deletedPosts,
                featuredPosts,
                categoriesStats,
                recentPosts
            ] = await Promise.all([
                postModel.countDocuments(),
                postModel.countDocuments({ status: 'active' }),
                postModel.countDocuments({ status: 'deleted' }),
                postModel.countDocuments({ featured: true, status: 'active' }),
                postModel.aggregate([
                    { $match: { status: 'active' } },
                    { $group: { _id: '$category', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ]),
                postModel.find({ status: 'active' })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .populate('createdBy', 'username fullName')
            ]);

            return {
                totals: {
                    total: totalPosts,
                    active: activePosts,
                    deleted: deletedPosts,
                    featured: featuredPosts
                },
                categories: categoriesStats,
                recent: recentPosts
            };
        } catch (error) {
            throw new Error(`Error getting statistics: ${error.message}`);
        }
    }

    // Search posts with advanced options
    async search(searchTerm, options = {}) {
        try {
            const {
                category = '',
                minPrice = 0,
                maxPrice = 0,
                page = 1,
                limit = 10
            } = options;

            const query = {
                $text: { $search: searchTerm },
                status: 'active'
            };

            if (category) query.category = category;
            if (minPrice > 0) query.price = { $gte: minPrice };
            if (maxPrice > 0) query.price = { ...query.price, $lte: maxPrice };

            const result = await postModel.paginate(query, {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: { score: { $meta: 'textScore' } },
                populate: {
                    path: 'createdBy',
                    select: 'username fullName role'
                }
            });

            return result;
        } catch (error) {
            throw new Error(`Error searching posts: ${error.message}`);
        }
    }
}

module.exports = new AdvancedPostService();
