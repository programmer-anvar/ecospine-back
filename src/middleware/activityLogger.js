const ActivityLog = require('../models/activityLog.model');

// Middleware to log activities
const logActivity = (action, resource) => {
    return async (req, res, next) => {
        // Store original res.json to intercept response
        const originalJson = res.json;
        
        res.json = function(data) {
            // Log activity after successful response
            const logData = {
                user: req.user ? req.user._id : null,
                action,
                resource,
                resourceId: req.params.id || (data && data.data && data.data._id) || null,
                details: {
                    method: req.method,
                    url: req.originalUrl,
                    body: req.method !== 'GET' ? req.body : undefined,
                    query: req.query,
                    statusCode: res.statusCode
                },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                success: res.statusCode < 400
            };

            // Log activity asynchronously (don't wait)
            ActivityLog.logActivity(logData).catch(error => {
                console.error('Activity logging failed:', error);
            });

            // Call original res.json
            return originalJson.call(this, data);
        };

        next();
    };
};

// Helper function to manually log activities
const manualLog = async (req, action, resource, resourceId = null, details = {}, success = true, errorMessage = null) => {
    const logData = {
        user: req.user ? req.user._id : null,
        action,
        resource,
        resourceId,
        details: {
            method: req.method,
            url: req.originalUrl,
            ...details
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        success,
        errorMessage
    };

    return ActivityLog.logActivity(logData);
};

// Specific activity loggers
const loggers = {
    // Authentication
    login: logActivity('LOGIN', 'system'),
    loginFailed: (req, errorMessage) => manualLog(req, 'LOGIN_FAILED', 'system', null, {}, false, errorMessage),
    logout: logActivity('LOGOUT', 'system'),

    // Posts
    postCreated: logActivity('POST_CREATED', 'post'),
    postUpdated: logActivity('POST_UPDATED', 'post'),
    postDeleted: logActivity('POST_DELETED', 'post'),
    postViewed: logActivity('POST_VIEWED', 'post'),

    // Users
    userCreated: logActivity('USER_CREATED', 'user'),
    userUpdated: logActivity('USER_UPDATED', 'user'),
    userActivated: logActivity('USER_ACTIVATED', 'user'),
    userDeactivated: logActivity('USER_DEACTIVATED', 'user'),

    // Files
    fileUploaded: logActivity('FILE_UPLOADED', 'file'),
    fileDeleted: logActivity('FILE_DELETED', 'file'),

    // System
    systemAccess: logActivity('SYSTEM_ACCESS', 'system'),
    permissionDenied: (req, details) => manualLog(req, 'PERMISSION_DENIED', 'system', null, details, false)
};

module.exports = {
    logActivity,
    manualLog,
    loggers
};
