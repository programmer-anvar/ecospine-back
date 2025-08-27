const { Schema, model } = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const activityLogSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            // Authentication
            'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
            
            // Post Management
            'POST_CREATED', 'POST_UPDATED', 'POST_DELETED', 'POST_VIEWED',
            
            // User Management
            'USER_CREATED', 'USER_UPDATED', 'USER_ACTIVATED', 'USER_DEACTIVATED',
            
            // File Management
            'FILE_UPLOADED', 'FILE_DELETED',
            
            // System
            'SYSTEM_ACCESS', 'PERMISSION_DENIED'
        ]
    },
    resource: {
        type: String,
        enum: ['post', 'user', 'file', 'system'],
        required: true
    },
    resourceId: {
        type: Schema.Types.ObjectId,
        default: null // Can be null for system actions
    },
    details: {
        type: Schema.Types.Mixed, // Flexible object for action-specific data
        default: {}
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        default: null
    },
    success: {
        type: Boolean,
        default: true
    },
    errorMessage: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for better query performance
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ resource: 1, resourceId: 1 });
activityLogSchema.index({ success: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 }); // For general sorting

// Add pagination plugin
activityLogSchema.plugin(mongoosePaginate);

// Static method to log activity
activityLogSchema.statics.logActivity = async function(data) {
    try {
        const log = new this(data);
        await log.save();
        return log;
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw error - logging should not break main functionality
        return null;
    }
};

// Static method to get user activities
activityLogSchema.statics.getUserActivities = function(userId, options = {}) {
    const {
        page = 1,
        limit = 20,
        action = null,
        resource = null,
        startDate = null,
        endDate = null
    } = options;

    const query = { user: userId };
    
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    return this.paginate(query, {
        page,
        limit,
        sort: { createdAt: -1 },
        populate: {
            path: 'user',
            select: 'username fullName role'
        }
    });
};

// Static method to get system activities (for owners)
activityLogSchema.statics.getSystemActivities = function(options = {}) {
    const {
        page = 1,
        limit = 50,
        action = null,
        resource = null,
        startDate = null,
        endDate = null,
        userId = null
    } = options;

    const query = {};
    
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (userId) query.user = userId;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    return this.paginate(query, {
        page,
        limit,
        sort: { createdAt: -1 },
        populate: {
            path: 'user',
            select: 'username fullName role'
        }
    });
};

module.exports = model('ActivityLog', activityLogSchema);
