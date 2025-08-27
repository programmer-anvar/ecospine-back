const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    role: {
        type: String,
        enum: ['owner', 'moderator'],
        default: 'moderator'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null // null for owner, ObjectId for moderators
    },
    lastLogin: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const hashedPassword = await bcrypt.hash(this.password, 12);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if user is owner
userSchema.methods.isOwner = function() {
    return this.role === 'owner';
};

// Instance method to check if user is moderator
userSchema.methods.isModerator = function() {
    return this.role === 'moderator';
};

// Instance method to check if user can manage posts
userSchema.methods.canManagePosts = function() {
    return this.role === 'owner' || this.role === 'moderator';
};

// Instance method to check if user can manage users
userSchema.methods.canManageUsers = function() {
    return this.role === 'owner';
};

// Static method to find active users
userSchema.statics.findActive = function() {
    return this.find({ isActive: true });
};

// Static method to find by role
userSchema.statics.findByRole = function(role) {
    return this.find({ role, isActive: true });
};

// Don't return password in JSON
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

module.exports = model('User', userSchema);
