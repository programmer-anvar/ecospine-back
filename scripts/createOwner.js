require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user.model');

const createOwner = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DB_URL, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ Connected to MongoDB');

        // Check if owner already exists
        const existingOwner = await User.findOne({ role: 'owner' });
        if (existingOwner) {
            console.log('❌ Owner already exists:', existingOwner.username);
            process.exit(1);
        }

        // Get owner details from command line or use defaults
        const ownerData = {
            username: process.argv[2] || 'admin',
            email: process.argv[3] || 'admin@ecospine.com',
            password: process.argv[4] || 'Admin123!',
            fullName: process.argv[5] || 'System Administrator',
            role: 'owner',
            isActive: true
        };

        // Create owner
        const owner = new User(ownerData);
        await owner.save();

        console.log('🎉 Owner created successfully!');
        console.log('📋 Owner Details:');
        console.log(`   Username: ${owner.username}`);
        console.log(`   Email: ${owner.email}`);
        console.log(`   Full Name: ${owner.fullName}`);
        console.log(`   Role: ${owner.role}`);
        console.log(`   ID: ${owner._id}`);
        console.log('\n🔑 Login Credentials:');
        console.log(`   Username: ${ownerData.username}`);
        console.log(`   Password: ${ownerData.password}`);
        console.log('\n📖 Next Steps:');
        console.log('   1. Start the server: npm start');
        console.log('   2. Login at: POST /api/v1/auth/login');
        console.log('   3. Access Swagger docs: http://localhost:8080/api/docs');

    } catch (error) {
        console.error('❌ Error creating owner:', error.message);
        
        if (error.code === 11000) {
            console.log('💡 Tip: Username or email already exists. Try different credentials.');
        }
        
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
};

// Run the script
createOwner();
