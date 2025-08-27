require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const path = require("path");
const cors = require("cors");
const compression = require("compression");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./src/config/swagger");

// Import middleware
const logger = require("./src/middleware/logger");
const {
	helmetConfig,
	generalLimiter,
	uploadLimiter,
} = require("./src/middleware/security");
const {
	errorHandler,
	notFoundHandler,
} = require("./src/middleware/errorHandler");

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set("trust proxy", 1);

// Security middleware
app.use(helmetConfig);

// Compression middleware for better performance
app.use(compression());

// Logging middleware
app.use(logger);

// CORS configuration
app.use(
	cors({
		origin:
			process.env.NODE_ENV === "production"
				? process.env.FRONTEND_URL || false
				: true, // Allow all origins in development
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// File upload middleware
app.use(
	fileUpload({
		createParentPath: true,
		limits: {
			fileSize: 10 * 1024 * 1024, // 10MB max file size
		},
		abortOnLimit: true,
		responseOnLimit: "File size limit exceeded",
	})
);

// Rate limiting
app.use("/api/", generalLimiter);

// Static files serving with API versioning
app.use(
	"/api/v1/static",
	express.static(path.join(__dirname, "src", "static"))
);

// Health check endpoint
app.get("/", (req, res) => {
	res.status(200).json({
		success: true,
		message: "EcoSpine Backend API is running",
		version: "1.0.0",
		status: "OK",
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV || "development",
	});
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check
 *     description: Check if the API is running
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "EcoSpine Backend API is running"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: "development"
 */

/**
 * @swagger
 * /static/{filename}:
 *   get:
 *     summary: Get static file
 *     description: Retrieve uploaded image files
 *     tags: [Static Files]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         description: Image filename
 *         schema:
 *           type: string
 *           example: "uuid-filename.jpg"
 *     responses:
 *       200:
 *         description: Image file
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 */

// Swagger Documentation
app.use(
	"/api/docs",
	swaggerUi.serve,
	swaggerUi.setup(swaggerSpecs, {
		explorer: true,
		customCss: ".swagger-ui .topbar { display: none }",
		customSiteTitle: "EcoSpine API Documentation",
		swaggerOptions: {
			persistAuthorization: true,
			displayRequestDuration: true,
		},
	})
);

// API Info endpoint
app.get("/api", (req, res) => {
	res.status(200).json({
		success: true,
		message: "EcoSpine API",
		version: "1.0.0",
		documentation: "/api/docs",
		endpoints: {
			posts: "/api/v1/posts",
			auth: "/api/v1/auth",
			categories: "/api/v1/categories",
			static: "/api/v1/static/:filename",
		},
		timestamp: new Date().toISOString(),
	});
});

// API v1 routes
app.use("/api/v1/posts", require("./src/router/advancedPost.route"));
app.use("/api/v1/auth", require("./src/router/auth.route"));
app.use("/api/v1/categories", require("./src/router/category.route"));

// API v1 test endpoints (only in development)
if (process.env.NODE_ENV !== "production") {
	app.get("/api/v1/test-cors", (req, res) => {
		res.json({
			success: true,
			message: "CORS is working!",
			version: "v1",
			timestamp: new Date().toISOString(),
			origin: req.headers.origin,
		});
	});

	app.post("/api/v1/test-upload", uploadLimiter, (req, res) => {
		console.log("Test upload - Request body:", req.body);
		console.log("Test upload - Request files:", req.files);

		res.json({
			success: true,
			message: "Test upload endpoint",
			version: "v1",
			data: {
				body: req.body,
				files: req.files ? Object.keys(req.files) : "No files",
			},
			timestamp: new Date().toISOString(),
		});
	});
}

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 8080;

const bootstrap = async () => {
	try {
		await mongoose.connect(process.env.DB_URL, {
			maxPoolSize: 10,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
		});
		console.log("✅ Connected to MongoDB");

		app.listen(PORT, () => {
			console.log(`🚀 Server running on http://localhost:${PORT}`);
			console.log(
				`📚 Environment: ${process.env.NODE_ENV || "development"}`
			);
			console.log(
				`📖 API Documentation: http://localhost:${PORT}/api/docs`
			);
			console.log(`📋 API Info: http://localhost:${PORT}/api`);
			console.log(`🏥 Health Check: http://localhost:${PORT}/`);
		});
	} catch (error) {
		console.error("❌ Error connecting to DB:", error);
		process.exit(1);
	}
};

bootstrap();
