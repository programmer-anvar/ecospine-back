/**
 * Standardized API response utility
 */

class ApiResponse {
    /**
     * Success response
     * @param {Object} res - Express response object
     * @param {*} data - Response data
     * @param {string} message - Success message
     * @param {number} statusCode - HTTP status code
     */
    static success(res, data = null, message = 'Success', statusCode = 200) {
        const response = {
            success: true,
            message,
            timestamp: new Date().toISOString()
        };

        if (data !== null) {
            if (Array.isArray(data)) {
                response.data = data;
                response.count = data.length;
            } else {
                response.data = data;
            }
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Error response
     * @param {Object} res - Express response object
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {*} error - Error details
     */
    static error(res, message = 'Error', statusCode = 500, error = null) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString()
        };

        if (error) {
            response.error = error;
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Created response (for POST requests)
     * @param {Object} res - Express response object
     * @param {*} data - Created resource data
     * @param {string} message - Success message
     */
    static created(res, data, message = 'Resource created successfully') {
        return this.success(res, data, message, 201);
    }

    /**
     * No content response (for DELETE requests)
     * @param {Object} res - Express response object
     * @param {string} message - Success message
     */
    static noContent(res, message = 'Resource deleted successfully') {
        return this.success(res, null, message, 200);
    }

    /**
     * Not found response
     * @param {Object} res - Express response object
     * @param {string} message - Error message
     */
    static notFound(res, message = 'Resource not found') {
        return this.error(res, message, 404);
    }

    /**
     * Bad request response
     * @param {Object} res - Express response object
     * @param {string} message - Error message
     * @param {*} error - Error details
     */
    static badRequest(res, message = 'Bad request', error = null) {
        return this.error(res, message, 400, error);
    }

    /**
     * Unauthorized response
     * @param {Object} res - Express response object
     * @param {string} message - Error message
     */
    static unauthorized(res, message = 'Unauthorized') {
        return this.error(res, message, 401);
    }

    /**
     * Forbidden response
     * @param {Object} res - Express response object
     * @param {string} message - Error message
     */
    static forbidden(res, message = 'Forbidden') {
        return this.error(res, message, 403);
    }
}

module.exports = ApiResponse;
