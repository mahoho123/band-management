const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/trpc`;

// 測試配置
const TEST_CONFIG = {
  numUsers: 5,
  operationsPerUser: 10,
  delayBetweenOps: 100, // ms
};

// 性能指標
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalDuration: 0,
  responseTimes: [],
  errors: [],
};

// 模擬用戶操作
async function simulateUserOperation(userId) {
  const operations = [
    { name: 'getSystem', endpoint: 'band.getSystem' },
    { name: 'getMembers', endpoint: 'band.getMembers' },
    { name: 'getEvents', endpoint: 'band.getEvents' },
  ];

  for (let i = 0; i < TEST_CONFIG.operationsPerUser; i++) {
    const operation = operations[i % operations.length];
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(
        `${API_URL}/${operation.endpoint}?input=%7B%22json%22%3Anull%7D`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const duration = Date.now() - startTime;
      
      metrics.totalRequests++;
      metrics.responseTimes.push(duration);
      metrics.totalDuration += duration;

      if (response.ok) {
        metrics.successfulRequests++;
        console.log(`[User ${userId}] ${operation.name}: ${duration}ms ✓`);
      } else {
        metrics.failedRequests++;
        metrics.errors.push(`${operation.name}: ${response.status}`);
        console.log(`[User ${userId}] ${operation.name}: ${response.status} ✗`);
      }
    } catch (error) {
      metrics.failedRequests++;
      metrics.errors.push(`${operation.name}: ${error.message}`);
      console.log(`[User ${userId}] ${operation.name}: Error - ${error.message}`);
    }

    // 延遲以避免過度負載
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.delayBetweenOps));
  }
}

// 並發運行多個用戶
async function runPerformanceTest() {
  console.log(`\n🚀 開始性能測試...`);
  console.log(`📊 配置: ${TEST_CONFIG.numUsers} 個用戶, 每個用戶 ${TEST_CONFIG.operationsPerUser} 個操作\n`);

  const startTime = Date.now();

  // 並發運行所有用戶
  const userPromises = [];
  for (let i = 1; i <= TEST_CONFIG.numUsers; i++) {
    userPromises.push(simulateUserOperation(i));
  }

  await Promise.all(userPromises);

  const totalTime = Date.now() - startTime;

  // 計算統計數據
  const avgResponseTime = metrics.totalDuration / metrics.totalRequests;
  const minResponseTime = Math.min(...metrics.responseTimes);
  const maxResponseTime = Math.max(...metrics.responseTimes);
  const successRate = (metrics.successfulRequests / metrics.totalRequests * 100).toFixed(2);

  // 輸出報告
  console.log(`\n\n📈 性能測試報告`);
  console.log(`${'='.repeat(50)}`);
  console.log(`總請求數: ${metrics.totalRequests}`);
  console.log(`成功: ${metrics.successfulRequests} (${successRate}%)`);
  console.log(`失敗: ${metrics.failedRequests}`);
  console.log(`\n⏱️  響應時間統計`);
  console.log(`平均: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`最小: ${minResponseTime}ms`);
  console.log(`最大: ${maxResponseTime}ms`);
  console.log(`\n總耗時: ${totalTime}ms`);
  console.log(`吞吐量: ${(metrics.totalRequests / (totalTime / 1000)).toFixed(2)} req/s`);

  if (metrics.errors.length > 0) {
    console.log(`\n⚠️  錯誤:`);
    metrics.errors.forEach(err => console.log(`  - ${err}`));
  }

  console.log(`${'='.repeat(50)}\n`);

  // 性能評估
  if (avgResponseTime < 500) {
    console.log(`✅ 性能優秀: 平均響應時間 < 500ms`);
  } else if (avgResponseTime < 1000) {
    console.log(`⚠️  性能可接受: 平均響應時間 < 1000ms`);
  } else {
    console.log(`❌ 性能需要改進: 平均響應時間 >= 1000ms`);
  }

  if (successRate < 95) {
    console.log(`⚠️  成功率低於 95%，需要檢查伺服器穩定性`);
  }
}

// 運行測試
runPerformanceTest().catch(console.error);
