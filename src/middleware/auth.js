const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const ApiResponse = require('../utils/response');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : null;

        if (!token) {
            return ApiResponse.unauthorized(res, 'Access token required');
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return ApiResponse.unauthorized(res, 'User not found');
        }

        if (!user.isActive) {
            return ApiResponse.unauthorized(res, 'User account is deactivated');
        }

        // Add user to request object
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return ApiResponse.unauthorized(res, 'Token expired');
        }
        if (error.name === 'JsonWebTokenError') {
            return ApiResponse.unauthorized(res, 'Invalid token');
        }
        
        console.error('Auth middleware error:', error);
        return ApiResponse.error(res, 'Authentication failed', 500);
    }
};

// Check if user is owner
const requireOwner = (req, res, next) => {
    if (!req.user) {
        return ApiResponse.unauthorized(res, 'Authentication required');
    }
    
    if (!req.user.isOwner()) {
        return ApiResponse.forbidden(res, 'Owner access required');
    }
    
    next();
};

// Check if user is moderator or owner
const requireModerator = (req, res, next) => {
    if (!req.user) {
        return ApiResponse.unauthorized(res, 'Authentication required');
    }
    
    if (!req.user.canManagePosts()) {
        return ApiResponse.forbidden(res, 'Moderator or Owner access required');
    }
    
    next();
};

// Check if user can manage users (only owner)
const requireUserManagement = (req, res, next) => {
    if (!req.user) {
        return ApiResponse.unauthorized(res, 'Authentication required');
    }
    
    if (!req.user.canManageUsers()) {
        return ApiResponse.forbidden(res, 'Owner access required for user management');
    }
    
    next();
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : null;

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive) {
            req.user = user;
        } else {
            req.user = null;
        }
        
        next();
    } catch (error) {
        // If token is invalid, just continue without user
        req.user = null;
        next();
    }
};

module.exports = {
    generateToken,
    authenticateToken,
    requireOwner,
    requireModerator,
    requireUserManagement,
    optionalAuth
};
