const morgan = require('morgan');

// Custom token for response time
morgan.token('response-time-colored', (req, res) => {
    const responseTime = res.getHeader('X-Response-Time');
    if (!responseTime) return '-';
    
    const time = parseFloat(responseTime);
    if (time < 100) return `\x1b[32m${responseTime}\x1b[0m`; // Green for fast
    if (time < 500) return `\x1b[33m${responseTime}\x1b[0m`; // Yellow for medium
    return `\x1b[31m${responseTime}\x1b[0m`; // Red for slow
});

// Custom token for status code coloring
morgan.token('status-colored', (req, res) => {
    const status = res.statusCode;
    if (status >= 200 && status < 300) return `\x1b[32m${status}\x1b[0m`; // Green
    if (status >= 300 && status < 400) return `\x1b[36m${status}\x1b[0m`; // Cyan
    if (status >= 400 && status < 500) return `\x1b[33m${status}\x1b[0m`; // Yellow
    return `\x1b[31m${status}\x1b[0m`; // Red
});

// Development format with colors
const devFormat = ':method :url :status-colored :response-time-colored ms - :res[content-length]';

// Production format (without colors)
const prodFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

const logger = process.env.NODE_ENV === 'production' 
    ? morgan(prodFormat)
    : morgan(devFormat);

module.exports = logger;
