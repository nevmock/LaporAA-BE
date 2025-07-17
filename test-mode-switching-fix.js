const axios = require('axios');

const API_URL = 'http://localhost:3001';
const TEST_USER = '6281234567890';

console.log('🧪 Testing Mode Switching Bug Fixes...\n');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

async function getDebugMode() {
    const result = await testAPI('GET', `/mode/${TEST_USER}?debug=true`);
    return result.data;
}

async function runTests() {
    console.log('📋 Test Suite: Mode Switching Bug Fixes\n');
    
    // Reset to clean state
    console.log('1️⃣ Reset to clean state...');
    await testAPI('POST', `/mode/force/${TEST_USER}`, { force: false });
    await testAPI('PUT', `/mode/${TEST_USER}`, { mode: 'bot' });
    let mode = await getCurrentMode();
    console.log(`   Initial state: ${mode.effectiveMode} (force: ${mode.forceModeManual})\n`);
    
    // Test 1: Normal mode switching
    console.log('2️⃣ Test normal mode switching...');
    await testAPI('PUT', `/mode/${TEST_USER}`, { mode: 'manual' });
    mode = await getCurrentMode();
    console.log(`   ✅ Manual mode: ${mode.effectiveMode === 'manual' ? 'PASS' : 'FAIL'}`);
    
    await testAPI('PUT', `/mode/${TEST_USER}`, { mode: 'bot' });
    mode = await getCurrentMode();
    console.log(`   ✅ Bot mode: ${mode.effectiveMode === 'bot' ? 'PASS' : 'FAIL'}\n`);
    
    // Test 2: Manual mode with timeout
    console.log('3️⃣ Test manual mode with timeout...');
    await testAPI('POST', `/mode/manual/${TEST_USER}`, { minutes: 0.1 }); // 6 seconds
    mode = await getCurrentMode();
    console.log(`   ✅ Manual with timeout: ${mode.effectiveMode === 'manual' && mode.manualModeUntil ? 'PASS' : 'FAIL'}`);
    console.log(`   ⏱️ Timeout in ${mode.timeLeft}`);
    
    // Wait for timeout to expire
    console.log('   ⏳ Waiting for timeout to expire (7 seconds)...');
    await sleep(7000);
    
    mode = await getCurrentMode();
    console.log(`   ✅ Auto return to bot: ${mode.effectiveMode === 'bot' ? 'PASS' : 'FAIL'}\n`);
    
    // Test 3: Force mode behavior
    console.log('4️⃣ Test force mode behavior...');
    await testAPI('POST', `/mode/force/${TEST_USER}`, { force: true });
    mode = await getCurrentMode();
    console.log(`   ✅ Force mode activated: ${mode.forceModeManual && mode.effectiveMode === 'manual' ? 'PASS' : 'FAIL'}`);
    
    // Try to switch mode when force is active
    const switchResult = await testAPI('PUT', `/mode/${TEST_USER}`, { mode: 'bot' });
    console.log(`   ✅ Mode switch blocked: ${!switchResult.data.success ? 'PASS' : 'FAIL'}`);
    console.log(`   📝 Message: ${switchResult.data.message}`);
    
    // Try manual mode with timeout when force is active
    const timeoutResult = await testAPI('POST', `/mode/manual/${TEST_USER}`, { minutes: 5 });
    console.log(`   ✅ Timeout blocked: ${!timeoutResult.data.success ? 'PASS' : 'FAIL'}`);
    console.log(`   📝 Message: ${timeoutResult.data.message}\n`);
    
    // Test 4: Force mode deactivation with timeout
    console.log('5️⃣ Test force mode deactivation...');
    
    // Set manual with timeout first
    await testAPI('POST', `/mode/force/${TEST_USER}`, { force: false });
    await testAPI('POST', `/mode/manual/${TEST_USER}`, { minutes: 5 });
    mode = await getCurrentMode();
    console.log(`   📝 Manual with 5min timeout: ${mode.effectiveMode} (timeout: ${mode.manualModeUntil ? 'yes' : 'no'})`);
    
    // Activate force mode
    await testAPI('POST', `/mode/force/${TEST_USER}`, { force: true });
    mode = await getCurrentMode();
    console.log(`   📝 Force activated: ${mode.effectiveMode} (timeout cleared: ${!mode.manualModeUntil ? 'yes' : 'no'})`);
    
    // Deactivate force mode - should return to manual because timeout is still active
    await testAPI('POST', `/mode/force/${TEST_USER}`, { force: false });
    mode = await getCurrentMode();
    console.log(`   ✅ Force deactivated correctly: ${mode.effectiveMode === 'manual' ? 'PASS' : 'FAIL'}`);
    console.log(`   📝 Should be manual because timeout was recreated\n`);
    
    // Test 5: Conflict detection
    console.log('6️⃣ Test conflict detection...');
    const debugMode = await getDebugMode();
    console.log(`   📊 Conflicts detected: ${debugMode.conflicts.length}`);
    debugMode.conflicts.forEach((conflict, i) => {
        console.log(`   ${i + 1}. ${conflict}`);
    });
    
    if (debugMode.conflicts.length > 0) {
        console.log('   🔧 Running auto-fix...');
        await testAPI('POST', `/mode/debug/fix/${TEST_USER}`, debugMode);
        const fixedMode = await getDebugMode();
        console.log(`   ✅ Conflicts after fix: ${fixedMode.conflicts.length === 0 ? 'RESOLVED' : 'STILL PRESENT'}`);
    } else {
        console.log('   ✅ No conflicts detected');
    }
    
    console.log('\n🎉 Test suite completed!');
    
    // Final cleanup
    await testAPI('POST', `/mode/force/${TEST_USER}`, { force: false });
    await testAPI('PUT', `/mode/${TEST_USER}`, { mode: 'bot' });
    console.log('🧹 Cleaned up test data');
}

// Run the tests
runTests().catch(console.error);
