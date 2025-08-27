const {v4: uuidv4} = require("uuid");
const fs = require("fs"); //file system
const path = require("path");

class FileService {
    save(file) {
        try {
            if (!file) {
                throw new Error("File is required");
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.mimetype)) {
                throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
            }

            // Validate file size (10MB limit)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                throw new Error(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
            }
            
            // Get file extension from mimetype or original name
            const fileExtension = this.getFileExtension(file);
            const fileName = uuidv4() + fileExtension;
            const currentDir = __dirname;
            const staticDir = path.join(currentDir, "..", "static");
            const filePath = path.join(staticDir, fileName);

            // Create static directory if it doesn't exist
            if (!fs.existsSync(staticDir)) {
                fs.mkdirSync(staticDir, { recursive: true });
            }

            // Move file to static directory
            file.mv(filePath);
            console.log(`File saved successfully: ${fileName}`);
            return fileName;
        } catch (error) {
            console.error("File save error:", error);
            throw new Error(`Error saving file: ${error.message}`);
        }
    }

    getFileExtension(file) {
        if (file.mimetype) {
            const mimeTypes = {
                'image/jpeg': '.jpg',
                'image/jpg': '.jpg',
                'image/png': '.png',
                'image/gif': '.gif',
                'image/webp': '.webp'
            };
            return mimeTypes[file.mimetype] || '.jpg';
        }
        
        if (file.name) {
            return path.extname(file.name) || '.jpg';
        }
        
        return '.jpg';
    }

    delete(fileName) {
        try {
            if (!fileName) {
                throw new Error("File name is required");
            }

            const currentDir = __dirname;
            const staticDir = path.join(currentDir, "..", "static");
            const filePath = path.join(staticDir, fileName);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`File deleted successfully: ${fileName}`);
                return true;
            } else {
                console.log(`File not found: ${fileName}`);
                return false;
            }
        } catch (error) {
            console.error("File delete error:", error);
            throw new Error(`Error deleting file: ${error.message}`);
        }
    }
}

module.exports = new FileService()