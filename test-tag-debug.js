const mongoose = require('mongoose');
const tindakanRepo = require('./repositories/tindakanRepo');
const Tindakan = require('./models/Tindakan');

// Connect to database
mongoose.connect('mongodb+srv://ismaianugrah:optimus9021@cluster0.lwrui.mongodb.net/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
    testTagEndpoint();
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

async function testTagEndpoint() {
    try {
        // Get a sample tindakan ID
        const tindakans = await Tindakan.find({}).limit(1);
        console.log('Sample tindakan:', tindakans[0]);
        
        if (tindakans.length > 0) {
            const tindakanId = tindakans[0]._id;
            console.log('Testing with tindakanId:', tindakanId);
            
            // Test adding a tag
            const result = await tindakanRepo.addTag(tindakanId, 'test-tag');
            console.log('Add tag result:', result);
        } else {
            console.log('No tindakan found in database');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Don't call testTagEndpoint() here anymore since we call it in the connection event
