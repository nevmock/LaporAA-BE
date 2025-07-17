const axios = require('axios');

const API_URL = 'http://localhost:3001';
const TEST_USER = '6281234567890';

async function testAPI(method, endpoint, data = null) {
    try {
        const config = {
            method,
            url: `${API_URL}${endpoint}`,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (data) config.data = data;
        
        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message 
        };
    }
}

async function getCurrentMode() {
    const result = await testAPI('GET', `/mode/${TEST_USER}`);
    return result.data;
}

async function testForceTimeoutRestore() {
    console.log('🧪 Testing Force Mode Timeout Restore Fix...\n');
    
    // 1. Reset to clean state
    console.log('1️⃣ Reset to clean state...');
    await testAPI('POST', `/mode/force/${TEST_USER}`, { force: false });
    await testAPI('PUT', `/mode/${TEST_USER}`, { mode: 'bot' });
    let mode = await getCurrentMode();
    console.log(`   Clean state: ${mode.effectiveMode}\n`);
    
    // 2. Set manual mode with timeout (5 minutes)
    console.log('2️⃣ Set manual mode with 5 minute timeout...');
    await testAPI('POST', `/mode/manual/${TEST_USER}`, { minutes: 5 });
    mode = await getCurrentMode();
    console.log(`   Manual with timeout: ${mode.effectiveMode}`);
    console.log(`   Timeout until: ${mode.manualModeUntil}`);
    console.log(`   Time left: ${mode.timeLeft}\n`);
    
    const originalTimeout = mode.manualModeUntil;
    
    // 3. Activate force mode (should save timeout)
    console.log('3️⃣ Activate force mode...');
    await testAPI('POST', `/mode/force/${TEST_USER}`, { force: true });
    mode = await getCurrentMode();
    console.log(`   Force mode active: ${mode.forceModeManual}`);
    console.log(`   Current mode: ${mode.effectiveMode}`);
    console.log(`   Timeout cleared: ${mode.manualModeUntil === null ? 'YES' : 'NO'}\n`);
    
    // 4. Deactivate force mode (should restore timeout)
    console.log('4️⃣ Deactivate force mode...');
    await testAPI('POST', `/mode/force/${TEST_USER}`, { force: false });
    mode = await getCurrentMode();
    console.log(`   Force mode deactivated: ${!mode.forceModeManual}`);
    console.log(`   Current mode: ${mode.effectiveMode}`);
    console.log(`   Timeout restored: ${mode.manualModeUntil ? 'YES' : 'NO'}`);
    
    if (mode.manualModeUntil) {
        console.log(`   Restored timeout: ${mode.manualModeUntil}`);
        console.log(`   Time left: ${mode.timeLeft}`);
        
        // Check if timeout is similar to original (within reasonable range)
        const originalTime = new Date(originalTimeout).getTime();
        const restoredTime = new Date(mode.manualModeUntil).getTime();
        const timeDiff = Math.abs(originalTime - restoredTime);
        const timeDiffMinutes = timeDiff / (1000 * 60);
        
        console.log(`   Time difference: ${timeDiffMinutes.toFixed(2)} minutes`);
        
        if (timeDiffMinutes < 1) { // Less than 1 minute difference is acceptable
            console.log(`   ✅ PASS: Timeout restored correctly`);
        } else {
            console.log(`   ❌ FAIL: Timeout not restored correctly`);
        }
    } else {
        console.log(`   ❌ FAIL: Timeout not restored`);
    }
    
    console.log('\n5️⃣ Cleanup...');
    await testAPI('POST', `/mode/force/${TEST_USER}`, { force: false });
    await testAPI('PUT', `/mode/${TEST_USER}`, { mode: 'bot' });
    console.log('   Cleaned up\n');
    
    console.log('🎉 Test completed!');
}

testForceTimeoutRestore().catch(console.error);
