# EcoSpine Backend API

Professional backend API for EcoSpine application built with Node.js, Express, and MongoDB.

## 🚀 Features

- **RESTful API Design** - Clean and intuitive endpoints
- **File Upload Support** - Image uploads with validation
- **Professional Middleware** - Security, logging, validation, rate limiting
- **Error Handling** - Comprehensive error handling and logging
- **API Versioning** - Future-proof API design
- **Security** - Helmet, CORS, rate limiting protection
- **Validation** - Input validation with detailed error messages
- **Performance** - Compression and optimized database queries

## 📋 Prerequisites

- Node.js (v14+ recommended)
- MongoDB (local or cloud)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecospine-back
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DB_URL=mongodb://localhost:27017/ecospine
   # or for MongoDB Atlas:
   # DB_URL=mongodb+srv://username:password@cluster.mongodb.net/ecospine
   
   # Server
   PORT=8080
   NODE_ENV=development
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   
   # Frontend URL (for production CORS)
   FRONTEND_URL=http://localhost:3000
   ```

4. **Create Owner Account**
   ```bash
   # Create owner with default credentials
   npm run create-owner
   
   # Or create with custom credentials
   npm run create-owner admin admin@ecospine.com Admin123! "System Administrator"
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

### Swagger Documentation
Interactive API documentation is available at:
```
http://localhost:8080/api/docs
```

### Base URL
```
http://localhost:8080/api/v1
```

### Endpoints

#### Authentication
| Method | Endpoint | Description | Body | Auth Required |
|--------|----------|-------------|------|---------------|
| `POST` | `/auth/login` | Login (Owner/Moderator) | `username, password` | No |
| `GET` | `/auth/profile` | Get current user profile | - | Yes |
| `POST` | `/auth/moderators` | Create moderator | `username, email, password, fullName` | Owner |
| `GET` | `/auth/moderators` | Get all moderators | - | Owner |
| `PUT` | `/auth/moderators/:id` | Update moderator | User data | Owner |
| `PATCH` | `/auth/moderators/:id/activate` | Activate moderator | - | Owner |
| `PATCH` | `/auth/moderators/:id/deactivate` | Deactivate moderator | - | Owner |
| `GET` | `/auth/dashboard/stats` | Dashboard statistics | - | Owner |

#### Posts
| Method | Endpoint | Description | Body | Auth Required |
|--------|----------|-------------|------|---------------|
| `GET` | `/posts` | Get all posts | - | Optional |
| `POST` | `/posts` | Create new post | `title, body, price, image?` | Moderator+ |
| `GET` | `/posts/:id` | Get single post | - | Optional |
| `PUT` | `/posts/:id` | Update post | `title?, body?, price?, image?` | Moderator+ |
| `DELETE` | `/posts/:id` | Delete post | - | Moderator+ |

#### Static Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/static/:filename` | Get uploaded images |

#### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/api` | API information |

### Request Examples

#### Create Post
```bash
curl -X POST http://localhost:8080/api/v1/posts \
  -F "title=Sample Post" \
  -F "body=This is a sample post body" \
  -F "price=99.99" \
  -F "image=@image.jpg"
```

#### Get All Posts
```bash
curl http://localhost:8080/api/v1/posts
```

### Response Format

#### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "count": 10, // For arrays only
  "timestamp": "2025-08-27T06:09:31.282Z"
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information",
  "timestamp": "2025-08-27T06:09:31.282Z"
}
```

## 🔒 Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing protection
- **Rate Limiting** - Request throttling
  - General: 100 requests per 15 minutes
  - File uploads: 10 uploads per 15 minutes
- **Input Validation** - Request data validation
- **File Upload Security** - Type and size validation

## 📁 Project Structure

```
ecospine-back/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/         # Database models
│   ├── router/         # Route definitions
│   ├── server/         # Business logic services
│   ├── static/         # Uploaded files
│   └── utils/          # Utility functions
├── app.js              # Application entry point
├── package.json        # Dependencies and scripts
└── README.md          # Documentation
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_URL` | MongoDB connection string | Required |
| `PORT` | Server port | 8080 |
| `NODE_ENV` | Environment mode | development |
| `FRONTEND_URL` | Frontend URL for CORS | localhost:3000 |

## 🚦 Rate Limits

- **General API**: 100 requests per 15 minutes
- **File Uploads**: 10 uploads per 15 minutes
- **Auth Endpoints**: 5 requests per 15 minutes

## 📝 Validation Rules

### Post Creation/Update
- **Title**: 3-100 characters, required for creation
- **Body**: 10-1000 characters, required for creation
- **Price**: Positive number, required for creation
- **Image**: Optional, max 10MB, allowed types: jpeg, jpg, png, gif, webp

## 🐛 Error Handling

The API includes comprehensive error handling for:
- Validation errors
- Database errors
- File upload errors
- Authentication errors
- Rate limiting
- 404 Not Found
- Internal server errors

## 📊 Logging

Request logging includes:
- HTTP method and URL
- Response status and time
- File upload details
- Error tracking

## 🔄 API Versioning

Current version: **v1**
- All endpoints are prefixed with `/api/v1/`
- Future versions will maintain backward compatibility

## 🧪 Testing

Test the API using the included HTML test file:
```bash
# Open test-upload.html in your browser
# Or use curl/Postman with the provided examples
```

## 🚀 Deployment

1. **Set environment variables**
2. **Build and start**
   ```bash
   npm start
   ```
3. **Configure reverse proxy** (nginx/Apache)
4. **Set up SSL certificate**
5. **Configure monitoring**

## 📞 Support

For issues and questions, please check the error logs and API response messages for detailed information.

---

**Built with ❤️ for EcoSpine project**