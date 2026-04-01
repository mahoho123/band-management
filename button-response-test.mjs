// 檢查所有可能的按鈕點擊操作和 API 端點

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/trpc`;

// 所有可能的 tRPC 端點
const ENDPOINTS = [
  // 讀取操作
  'band.getMembers',
  'band.getEvents',
  'band.getHolidays',
  
  // 寫入操作
  'band.addMember',
  'band.addEvent',
  'band.setAttendance',
  'band.updateEvent',
  'band.deleteMember',
  'band.deleteEvent',
  
  // 系統操作
  'band.resetPassword',
  'auth.me',
  'auth.logout',
];

const results = {
  fast: [],      // < 100ms
  normal: [],    // 100-500ms
  slow: [],      // 500-1000ms
  verySlow: [],  // > 1000ms
  error: [],     // 錯誤
};

async function testEndpoint(endpoint) {
  try {
    const startTime = Date.now();
    
    const response = await fetch(
      `${API_URL}/${endpoint}?input=%7B%22json%22%3Anull%7D`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const duration = Date.now() - startTime;

    if (response.ok) {
      if (duration < 100) {
        results.fast.push({ endpoint, duration });
        console.log(`✅ ${endpoint}: ${duration}ms (快速)`);
      } else if (duration < 500) {
        results.normal.push({ endpoint, duration });
        console.log(`✅ ${endpoint}: ${duration}ms (正常)`);
      } else if (duration < 1000) {
        results.slow.push({ endpoint, duration });
        console.log(`⚠️  ${endpoint}: ${duration}ms (緩慢)`);
      } else {
        results.verySlow.push({ endpoint, duration });
        console.log(`❌ ${endpoint}: ${duration}ms (非常緩慢)`);
      }
    } else {
      results.error.push({ endpoint, status: response.status });
      console.log(`❌ ${endpoint}: ${response.status}`);
    }
  } catch (error) {
    results.error.push({ endpoint, error: error.message });
    console.log(`❌ ${endpoint}: ${error.message}`);
  }
}

async function runButtonResponseTest() {
  console.log(`\n🔘 按鈕響應性測試`);
  console.log(`測試所有 tRPC 端點的響應時間\n`);

  for (const endpoint of ENDPOINTS) {
    await testEndpoint(endpoint);
    // 延遲以避免過度負載
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // 生成報告
  console.log(`\n\n📊 測試結果摘要`);
  console.log(`${'='.repeat(50)}`);
  console.log(`快速 (< 100ms): ${results.fast.length} 個端點`);
  results.fast.forEach(r => console.log(`  ✅ ${r.endpoint}: ${r.duration}ms`));
  
  console.log(`\n正常 (100-500ms): ${results.normal.length} 個端點`);
  results.normal.forEach(r => console.log(`  ✅ ${r.endpoint}: ${r.duration}ms`));
  
  console.log(`\n緩慢 (500-1000ms): ${results.slow.length} 個端點`);
  results.slow.forEach(r => console.log(`  ⚠️  ${r.endpoint}: ${r.duration}ms`));
  
  console.log(`\n非常緩慢 (> 1000ms): ${results.verySlow.length} 個端點`);
  results.verySlow.forEach(r => console.log(`  ❌ ${r.endpoint}: ${r.duration}ms`));
  
  console.log(`\n錯誤: ${results.error.length} 個端點`);
  results.error.forEach(r => {
    if (r.status) {
      console.log(`  ❌ ${r.endpoint}: ${r.status}`);
    } else {
      console.log(`  ❌ ${r.endpoint}: ${r.error}`);
    }
  });

  console.log(`${'='.repeat(50)}\n`);

  // 性能評估
  const totalEndpoints = ENDPOINTS.length;
  const fastPercentage = (results.fast.length / totalEndpoints * 100).toFixed(1);
  const normalPercentage = ((results.fast.length + results.normal.length) / totalEndpoints * 100).toFixed(1);

  console.log(`📈 性能評估`);
  console.log(`快速端點佔比: ${fastPercentage}%`);
  console.log(`快速+正常端點佔比: ${normalPercentage}%`);

  if (normalPercentage >= 90) {
    console.log(`✅ 整體性能良好，90% 以上的端點響應時間 < 500ms`);
  } else if (normalPercentage >= 70) {
    console.log(`⚠️  整體性能可接受，但有改進空間`);
  } else {
    console.log(`❌ 整體性能需要改進`);
  }
}

runButtonResponseTest().catch(console.error);
