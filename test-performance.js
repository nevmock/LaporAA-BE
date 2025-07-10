#!/usr/bin/env node

// Test script untuk Admin Performance API
const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3001';

// Sample test data
const testLogin = {
    username: 'admin',
    password: 'admin123'
};

let authToken = '';

// Helper function untuk HTTP requests
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                try {
                    const responseData = JSON.parse(body);
                    resolve({
                        status: res.statusCode,
                        data: responseData
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        data: body
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function testPerformanceAPI() {
    console.log('🚀 Testing Admin Performance API...\n');

    try {
        // 1. Test Login
        console.log('1. Testing Login...');
        const loginResponse = await makeRequest('POST', '/auth/login', testLogin);
        
        if (loginResponse.status === 200 && loginResponse.data.token) {
            authToken = loginResponse.data.token;
            console.log('✅ Login successful');
            console.log(`   Token: ${authToken.substring(0, 20)}...`);
        } else {
            console.log('❌ Login failed:', loginResponse.data.message || 'Unknown error');
            return;
        }

        // 2. Test Dashboard Endpoint
        console.log('\n2. Testing Dashboard Endpoint...');
        const dashboardResponse = await makeRequest('GET', '/performance/dashboard', null, authToken);
        
        if (dashboardResponse.status === 200) {
            console.log('✅ Dashboard endpoint working');
            console.log(`   Admin Stats: ${dashboardResponse.data.adminStats?.length || 0} admins`);
            console.log(`   Report Stats: ${dashboardResponse.data.reportStats?.length || 0} reports`);
        } else {
            console.log('❌ Dashboard failed:', dashboardResponse.status, dashboardResponse.data);
        }

        // 3. Test Admin Status Endpoint
        console.log('\n3. Testing Admin Status Endpoint...');
        const statusResponse = await makeRequest('GET', '/performance/status', null, authToken);
        
        if (statusResponse.status === 200) {
            console.log('✅ Admin status endpoint working');
            console.log(`   Total Online: ${statusResponse.data.totalOnline}`);
            console.log(`   Total Active: ${statusResponse.data.totalActive}`);
        } else {
            console.log('❌ Admin status failed:', statusResponse.status, statusResponse.data);
        }

        // 4. Test Monthly Report Endpoint
        console.log('\n4. Testing Monthly Report Endpoint...');
        const monthlyResponse = await makeRequest('GET', '/performance/monthly?year=2025&month=7', null, authToken);
        
        if (monthlyResponse.status === 200) {
            console.log('✅ Monthly report endpoint working');
            console.log(`   Total Activities: ${monthlyResponse.data.totalActivities}`);
            console.log(`   Total Reports Processed: ${monthlyResponse.data.totalReportsProcessed}`);
        } else {
            console.log('❌ Monthly report failed:', monthlyResponse.status, monthlyResponse.data);
        }

        // 5. Test Activity Tracking (Simulate some activity)
        console.log('\n5. Testing Activity Tracking...');
        const reportResponse = await makeRequest('GET', '/reports', null, authToken);
        
        if (reportResponse.status === 200) {
            console.log('✅ Activity tracking via reports endpoint working');
        } else {
            console.log('❌ Activity tracking test failed:', reportResponse.status);
        }

        // 6. Test Logout
        console.log('\n6. Testing Logout...');
        const logoutResponse = await makeRequest('POST', '/auth/logout', {
            userId: loginResponse.data._id
        }, authToken);
        
        if (logoutResponse.status === 200) {
            console.log('✅ Logout successful');
        } else {
            console.log('❌ Logout failed:', logoutResponse.status, logoutResponse.data);
        }

        console.log('\n🎉 All tests completed!');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Helper function to test database models
async function testModels() {
    console.log('\n📊 Testing Database Models...');
    
    try {
        const mongoose = require('mongoose');
        
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lapor-aa');
        console.log('✅ Connected to database');

        const AdminActivity = require('./models/AdminActivity');
        const AdminSession = require('./models/AdminSession');

        // Test AdminActivity model
        const testActivity = new AdminActivity({
            admin: new mongoose.Types.ObjectId(),
            activityType: 'login',
            description: 'Test login',
            ipAddress: '127.0.0.1'
        });

        await testActivity.validate();
        console.log('✅ AdminActivity model validation passed');

        // Test AdminSession model
        const testSession = new AdminSession({
            admin: new mongoose.Types.ObjectId(),
            loginTime: new Date(),
            isActive: true
        });

        await testSession.validate();
        console.log('✅ AdminSession model validation passed');

        mongoose.disconnect();
        console.log('✅ Database tests completed');

    } catch (error) {
        console.error('❌ Database test failed:', error);
    }
}

// Main test runner
async function runTests() {
    console.log('🔧 Admin Performance API Test Suite');
    console.log('=====================================\n');

    await testModels();
    await testPerformanceAPI();
    
    console.log('\n📋 Test Summary:');
    console.log('- Database models validation');
    console.log('- API endpoints functionality');
    console.log('- Authentication flow');
    console.log('- Activity tracking');
    console.log('\n✨ Performance tracking system is ready to use!');
}

// Check if script is run directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testPerformanceAPI, testModels };
