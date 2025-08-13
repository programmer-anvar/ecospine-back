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
app.use(fileUpload({}))
app.use('/static', express.static(path.join(__dirname, 'static')))

// Test CORS endpoint
app.get('/api/test-cors', (req, res) => {
    res.json({ 
        message: 'CORS is working!', 
        timestamp: new Date().toISOString(),
        origin: req.headers.origin 
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
