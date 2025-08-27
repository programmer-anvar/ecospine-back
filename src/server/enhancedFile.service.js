const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

class EnhancedFileService {
    constructor() {
        this.uploadPath = path.join(__dirname, "..", "static");
        this.thumbnailPath = path.join(__dirname, "..", "static", "thumbnails");
        this.allowedMimeTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 
            'image/gif', 'image/webp', 'image/bmp'
        ];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        
        // Ensure directories exist
        this.ensureDirectories();
    }

    ensureDirectories() {
        [this.uploadPath, this.thumbnailPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    // Save single file with thumbnail generation
    async save(file, options = {}) {
        try {
            if (!file) {
                throw new Error("File is required");
            }

            // Validate file
            this.validateFile(file);

            const fileExtension = this.getFileExtension(file);
            const fileName = uuidv4() + fileExtension;
            const filePath = path.join(this.uploadPath, fileName);

            // Save original file
            await this.moveFile(file, filePath);

            // Generate thumbnail if it's an image
            let thumbnailName = null;
            if (this.isImageFile(file)) {
                thumbnailName = await this.generateThumbnail(filePath, fileName, options.thumbnailSize);
            }

            // Get file info
            const fileInfo = await this.getFileInfo(filePath);

            return {
                originalName: file.name,
                fileName,
                thumbnailName,
                size: fileInfo.size,
                mimeType: file.mimetype,
                path: `/api/v1/static/${fileName}`,
                thumbnailPath: thumbnailName ? `/api/v1/static/thumbnails/${thumbnailName}` : null,
                dimensions: fileInfo.dimensions
            };
        } catch (error) {
            console.error("File save error:", error);
            throw new Error(`Error saving file: ${error.message}`);
        }
    }

    // Save multiple files
    async saveMultiple(files, options = {}) {
        try {
            if (!files || !Array.isArray(files)) {
                throw new Error("Files array is required");
            }

            const savedFiles = [];
            for (const file of files) {
                const savedFile = await this.save(file, options);
                savedFiles.push(savedFile);
            }

            return savedFiles;
        } catch (error) {
            // Cleanup any partially saved files
            savedFiles.forEach(file => {
                this.delete(file.fileName).catch(err => 
                    console.error('Cleanup error:', err)
                );
            });
            throw error;
        }
    }

    // Generate thumbnail
    async generateThumbnail(filePath, fileName, size = { width: 300, height: 300 }) {
        try {
            const thumbnailName = `thumb_${fileName}`;
            const thumbnailPath = path.join(this.thumbnailPath, thumbnailName);

            await sharp(filePath)
                .resize(size.width, size.height, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: 80 })
                .toFile(thumbnailPath);

            return thumbnailName;
        } catch (error) {
            console.error("Thumbnail generation error:", error);
            return null; // Don't fail if thumbnail generation fails
        }
    }

    // Resize image
    async resizeImage(filePath, dimensions) {
        try {
            const resizedPath = filePath.replace(/\.(jpg|jpeg|png)$/i, `_resized.$1`);
            
            await sharp(filePath)
                .resize(dimensions.width, dimensions.height)
                .toFile(resizedPath);

            return resizedPath;
        } catch (error) {
            throw new Error(`Error resizing image: ${error.message}`);
        }
    }

    // Validate file
    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            throw new Error(`File too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`);
        }

        // Check file type
        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            throw new Error(`Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
        }

        // Check file name
        if (!file.name || file.name.length > 255) {
            throw new Error("Invalid file name");
        }
    }

    // Check if file is image
    isImageFile(file) {
        return file.mimetype.startsWith('image/');
    }

    // Get file extension
    getFileExtension(file) {
        if (file.mimetype) {
            const mimeTypes = {
                'image/jpeg': '.jpg',
                'image/jpg': '.jpg',
                'image/png': '.png',
                'image/gif': '.gif',
                'image/webp': '.webp',
                'image/bmp': '.bmp'
            };
            return mimeTypes[file.mimetype] || '.jpg';
        }
        
        if (file.name) {
            return path.extname(file.name) || '.jpg';
        }
        
        return '.jpg';
    }

    // Move file (promise wrapper for file.mv)
    moveFile(file, targetPath) {
        return new Promise((resolve, reject) => {
            file.mv(targetPath, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    // Get file information
    async getFileInfo(filePath) {
        try {
            const stats = fs.statSync(filePath);
            let dimensions = null;

            // Get image dimensions if it's an image
            if (this.isImageByPath(filePath)) {
                try {
                    const metadata = await sharp(filePath).metadata();
                    dimensions = {
                        width: metadata.width,
                        height: metadata.height
                    };
                } catch (error) {
                    console.warn("Could not get image dimensions:", error);
                }
            }

            return {
                size: stats.size,
                dimensions
            };
        } catch (error) {
            throw new Error(`Error getting file info: ${error.message}`);
        }
    }

    // Check if file is image by path
    isImageByPath(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
    }

    // Delete file and its thumbnail
    async delete(fileName) {
        try {
            if (!fileName) {
                throw new Error("File name is required");
            }

            const filePath = path.join(this.uploadPath, fileName);
            const thumbnailPath = path.join(this.thumbnailPath, `thumb_${fileName}`);

            // Delete original file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`File deleted: ${fileName}`);
            }

            // Delete thumbnail
            if (fs.existsSync(thumbnailPath)) {
                fs.unlinkSync(thumbnailPath);
                console.log(`Thumbnail deleted: thumb_${fileName}`);
            }

            return true;
        } catch (error) {
            console.error("File delete error:", error);
            throw new Error(`Error deleting file: ${error.message}`);
        }
    }

    // Get file stats
    getFileStats() {
        try {
            const files = fs.readdirSync(this.uploadPath);
            const thumbnails = fs.readdirSync(this.thumbnailPath);

            let totalSize = 0;
            files.forEach(file => {
                const filePath = path.join(this.uploadPath, file);
                const stats = fs.statSync(filePath);
                totalSize += stats.size;
            });

            return {
                totalFiles: files.length,
                totalThumbnails: thumbnails.length,
                totalSize: totalSize,
                totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
            };
        } catch (error) {
            console.error("Error getting file stats:", error);
            return null;
        }
    }
}

module.exports = new EnhancedFileService();
