const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI);

// Import Report model
const Report = require('./models/Report');

async function testPhotosStructure() {
    try {
        console.log('🧪 Testing new photos structure...');
        
        // Test data with new structure
        const testPhotos = [
            {
                url: '/uploads/test-image.jpg',
                type: 'image',
                caption: 'Test image',
                originalUrl: '/uploads/test-image.jpg'
            },
            {
                url: '/uploads/videos/test-video.mp4',
                type: 'video',
                caption: 'Test video',
                originalUrl: '/uploads/videos/test-video.mp4'
            }
        ];
        
        console.log('📝 Creating test report with new photos structure...');
        console.log('Test photos data:', JSON.stringify(testPhotos, null, 2));
        
        // This would test if the schema accepts the new structure
        const testReport = new Report({
            sessionId: 'test_' + Date.now(),
            from: '1234567890',
            user: new mongoose.Types.ObjectId(),
            location: {
                type: 'text',
                description: 'Test location'
            },
            message: 'Test message',
            photos: testPhotos
        });
        
        // Validate without saving
        await testReport.validate();
        console.log('✅ Photos structure validation passed!');
        
        console.log('📊 Photos field structure:');
        console.log(JSON.stringify(testReport.photos, null, 2));
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Photos structure test failed:', error);
        process.exit(1);
    }
}

testPhotosStructure();
