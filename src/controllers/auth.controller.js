const User = require('../models/user.model');
const { generateToken } = require('../middleware/auth');
const ApiResponse = require('../utils/response');

class AuthController {
    // Login for both owner and moderators
    async login(req, res, next) {
        try {
            const { username, password } = req.body;

            // Find user by username or email
            const user = await User.findOne({
                $or: [
                    { username: username },
                    { email: username }
                ],
                isActive: true
            });

            if (!user) {
                return ApiResponse.unauthorized(res, 'Invalid credentials');
            }

            // Check password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return ApiResponse.unauthorized(res, 'Invalid credentials');
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate token
            const token = generateToken(user._id);

            return ApiResponse.success(res, {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    lastLogin: user.lastLogin
                }
            }, 'Login successful');

        } catch (error) {
            console.error('Login error:', error);
            next(error);
        }
    }

    // Get current user profile
    async getProfile(req, res, next) {
        try {
            const user = await User.findById(req.user._id)
                .populate('createdBy', 'username fullName')
                .select('-password');

            if (!user) {
                return ApiResponse.notFound(res, 'User not found');
            }

            return ApiResponse.success(res, user, 'Profile fetched successfully');
        } catch (error) {
            console.error('Get profile error:', error);
            next(error);
        }
    }

    // Create moderator (only owner can do this)
    async createModerator(req, res, next) {
        try {
            const { username, email, password, fullName } = req.body;

            // Check if username or email already exists
            const existingUser = await User.findOne({
                $or: [
                    { username },
                    { email }
                ]
            });

            if (existingUser) {
                return ApiResponse.badRequest(res, 'Username or email already exists');
            }

            // Create new moderator
            const moderator = new User({
                username,
                email,
                password,
                fullName,
                role: 'moderator',
                createdBy: req.user._id
            });

            await moderator.save();

            return ApiResponse.created(res, {
                id: moderator._id,
                username: moderator.username,
                email: moderator.email,
                fullName: moderator.fullName,
                role: moderator.role,
                createdAt: moderator.createdAt
            }, 'Moderator created successfully');

        } catch (error) {
            console.error('Create moderator error:', error);
            next(error);
        }
    }

    // Get all moderators (only owner can do this)
    async getModerators(req, res, next) {
        try {
            const moderators = await User.find({ 
                role: 'moderator' 
            })
            .populate('createdBy', 'username fullName')
            .select('-password')
            .sort({ createdAt: -1 });

            return ApiResponse.success(res, moderators, 'Moderators fetched successfully');
        } catch (error) {
            console.error('Get moderators error:', error);
            next(error);
        }
    }

    // Update moderator (only owner can do this)
    async updateModerator(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Don't allow changing role or createdBy
            delete updateData.role;
            delete updateData.createdBy;

            const moderator = await User.findOneAndUpdate(
                { _id: id, role: 'moderator' },
                updateData,
                { new: true, runValidators: true }
            ).select('-password');

            if (!moderator) {
                return ApiResponse.notFound(res, 'Moderator not found');
            }

            return ApiResponse.success(res, moderator, 'Moderator updated successfully');
        } catch (error) {
            console.error('Update moderator error:', error);
            next(error);
        }
    }

    // Deactivate moderator (only owner can do this)
    async deactivateModerator(req, res, next) {
        try {
            const { id } = req.params;

            const moderator = await User.findOneAndUpdate(
                { _id: id, role: 'moderator' },
                { isActive: false },
                { new: true }
            ).select('-password');

            if (!moderator) {
                return ApiResponse.notFound(res, 'Moderator not found');
            }

            return ApiResponse.success(res, moderator, 'Moderator deactivated successfully');
        } catch (error) {
            console.error('Deactivate moderator error:', error);
            next(error);
        }
    }

    // Activate moderator (only owner can do this)
    async activateModerator(req, res, next) {
        try {
            const { id } = req.params;

            const moderator = await User.findOneAndUpdate(
                { _id: id, role: 'moderator' },
                { isActive: true },
                { new: true }
            ).select('-password');

            if (!moderator) {
                return ApiResponse.notFound(res, 'Moderator not found');
            }

            return ApiResponse.success(res, moderator, 'Moderator activated successfully');
        } catch (error) {
            console.error('Activate moderator error:', error);
            next(error);
        }
    }

    // Get dashboard stats (for owner)
    async getDashboardStats(req, res, next) {
        try {
            const [
                totalModerators,
                activeModerators,
                totalPosts
            ] = await Promise.all([
                User.countDocuments({ role: 'moderator' }),
                User.countDocuments({ role: 'moderator', isActive: true }),
                require('../models/post.model').countDocuments()
            ]);

            const stats = {
                users: {
                    totalModerators,
                    activeModerators,
                    inactiveModerators: totalModerators - activeModerators
                },
                posts: {
                    total: totalPosts
                }
            };

            return ApiResponse.success(res, stats, 'Dashboard stats fetched successfully');
        } catch (error) {
            console.error('Get dashboard stats error:', error);
            next(error);
        }
    }
}

module.exports = new AuthController();
