require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload')
const path = require('path')
const cors = require('cors')

const app = express();

// Simple CORS configuration
app.use(cors({
    origin: true, // Allow all origins for development
    credentials: true
}));

app.use(express.json())
app.use(fileUpload({
    createParentPath: true,
    limits: { 
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    },
    abortOnLimit: true,
    debug: true
}))
app.use('/static', express.static(path.join(__dirname, 'static')))

// Test CORS endpoint
app.get('/api/test-cors', (req, res) => {
    res.json({ 
        message: 'CORS is working!', 
        timestamp: new Date().toISOString(),
        origin: req.headers.origin 
    });
});

// Test file upload endpoint
app.post('/api/test-upload', (req, res) => {
    console.log('Test upload - Request body:', req.body);
    console.log('Test upload - Request files:', req.files);
    console.log('Test upload - Files keys:', req.files ? Object.keys(req.files) : 'No files');
    
    res.json({
        message: 'Test upload endpoint',
        body: req.body,
        files: req.files ? Object.keys(req.files) : 'No files',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/post', require('./router/post.route'))

const PORT = process.env.PORT || 8080

const bootstrap = async () => {
    try {
        await mongoose.connect(process.env.DB_URL).then(() => console.log("Connected DB"))
        app.listen(PORT, () => console.log(`Listening on - http://localhost:${PORT}`))
    } catch(error) {
        console.log(`Error connecting with DB: ${error}`); 
    }
}

bootstrap()
