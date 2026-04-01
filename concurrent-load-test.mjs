const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/trpc`;

// 測試配置
const TEST_CONFIGS = [
  { numUsers: 1, operationsPerUser: 10, name: '1 用戶' },
  { numUsers: 5, operationsPerUser: 10, name: '5 用戶' },
  { numUsers: 10, operationsPerUser: 10, name: '10 用戶' },
  { numUsers: 20, operationsPerUser: 10, name: '20 用戶' },
  { numUsers: 50, operationsPerUser: 10, name: '50 用戶' },
  { numUsers: 100, operationsPerUser: 5, name: '100 用戶' },
];

// 性能指標
class PerformanceMetrics {
  constructor(name) {
    this.name = name;
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.totalDuration = 0;
    this.responseTimes = [];
    this.errors = [];
    this.startTime = 0;
    this.endTime = 0;
  }

  addRequest(duration, success = true) {
    this.totalRequests++;
    if (success) {
      this.successfulRequests++;
    } else {
      this.failedRequests++;
    }
    this.totalDuration += duration;
    this.responseTimes.push(duration);
  }

  getStats() {
    if (this.responseTimes.length === 0) {
      return {
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
      };
    }

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const avg = this.totalDuration / this.totalRequests;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      avgResponseTime: avg.toFixed(2),
      minResponseTime: min,
      maxResponseTime: max,
      p95ResponseTime: p95,
      p99ResponseTime: p99,
    };
  }
}

// 模擬用戶操作
async function simulateUserOperation(userId, config) {
  const operations = [
    { name: 'getMembers', endpoint: 'band.getMembers' },
    { name: 'getEvents', endpoint: 'band.getEvents' },
    { name: 'getHolidays', endpoint: 'band.getHolidays' },
  ];

  for (let i = 0; i < config.operationsPerUser; i++) {
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
      
      if (response.ok) {
        return { duration, success: true };
      } else {
        return { duration, success: false, error: response.status };
      }
    } catch (error) {
      return { duration: 0, success: false, error: error.message };
    }
  }
}

// 並發運行多個用戶
async function runConcurrentTest(config) {
  const metrics = new PerformanceMetrics(config.name);
  metrics.startTime = Date.now();

  // 並發運行所有用戶
  const userPromises = [];
  for (let i = 1; i <= config.numUsers; i++) {
    userPromises.push(
      (async () => {
        for (let j = 0; j < config.operationsPerUser; j++) {
          const result = await simulateUserOperation(i, config);
          metrics.addRequest(result.duration, result.success);
          
          // 小延遲避免過度負載
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      })()
    );
  }

  await Promise.all(userPromises);
  metrics.endTime = Date.now();

  return metrics;
}

// 主測試函數
async function runConcurrentLoadTest() {
  console.log(`\n🚀 並發負載測試開始...\n`);

  const allResults = [];

  for (const config of TEST_CONFIGS) {
    console.log(`📊 測試配置: ${config.name}...`);
    const metrics = await runConcurrentTest(config);
    allResults.push(metrics);
    
    const stats = metrics.getStats();
    const successRate = (metrics.successfulRequests / metrics.totalRequests * 100).toFixed(2);
    const totalTime = (metrics.endTime - metrics.startTime) / 1000;
    const throughput = (metrics.totalRequests / totalTime).toFixed(2);

    console.log(`  ✓ 完成 - 平均: ${stats.avgResponseTime}ms, P95: ${stats.p95ResponseTime}ms, 成功率: ${successRate}%, 吞吐量: ${throughput} req/s\n`);
  }

  // 生成詳細報告
  console.log(`\n\n📈 並發負載測試報告`);
  console.log(`${'='.repeat(80)}`);
  console.log(`\n| 用戶數 | 平均響應時間 | P95 | P99 | 成功率 | 吞吐量 | 總耗時 |`);
  console.log(`|--------|------------|-----|-----|--------|--------|--------|`);

  for (const metrics of allResults) {
    const stats = metrics.getStats();
    const successRate = (metrics.successfulRequests / metrics.totalRequests * 100).toFixed(1);
    const totalTime = (metrics.endTime - metrics.startTime) / 1000;
    const throughput = (metrics.totalRequests / totalTime).toFixed(2);

    const userCount = metrics.name.match(/\d+/)[0];
    console.log(`| ${userCount.padEnd(6)} | ${String(stats.avgResponseTime).padEnd(10)}ms | ${String(stats.p95ResponseTime).padEnd(3)}ms | ${String(stats.p99ResponseTime).padEnd(3)}ms | ${successRate.padEnd(6)}% | ${throughput.padEnd(6)} | ${totalTime.toFixed(1)}s |`);
  }

  console.log(`${'='.repeat(80)}\n`);

  // 分析性能下降趨勢
  console.log(`\n📊 性能分析`);
  console.log(`${'='.repeat(80)}`);

  let criticalPoint = null;
  let maxAcceptableResponseTime = 500; // ms

  for (let i = 0; i < allResults.length; i++) {
    const metrics = allResults[i];
    const stats = metrics.getStats();
    const avgResponseTime = parseFloat(stats.avgResponseTime);

    if (avgResponseTime > maxAcceptableResponseTime && !criticalPoint) {
      criticalPoint = metrics.name;
    }
  }

  if (criticalPoint) {
    console.log(`⚠️  性能臨界點: ${criticalPoint}`);
    console.log(`   當用戶數達到 ${criticalPoint} 時，平均響應時間超過 ${maxAcceptableResponseTime}ms`);
  } else {
    console.log(`✅ 所有測試用戶數下，平均響應時間都在 ${maxAcceptableResponseTime}ms 以內`);
  }

  // 計算性能下降比例
  const firstMetrics = allResults[0];
  const lastMetrics = allResults[allResults.length - 1];
  const firstStats = firstMetrics.getStats();
  const lastStats = lastMetrics.getStats();

  const responseTimeIncrease = ((parseFloat(lastStats.avgResponseTime) - parseFloat(firstStats.avgResponseTime)) / parseFloat(firstStats.avgResponseTime) * 100).toFixed(1);
  const throughputDecrease = ((parseFloat(lastStats.avgResponseTime) / parseFloat(firstStats.avgResponseTime)) * 100).toFixed(1);

  console.log(`\n📈 性能變化趨勢`);
  console.log(`   1 用戶 → ${lastMetrics.name}:`);
  console.log(`   - 響應時間增加: ${responseTimeIncrease}%`);
  console.log(`   - 吞吐量變化: ${throughputDecrease}%`);

  // 建議
  console.log(`\n💡 建議`);
  if (criticalPoint) {
    console.log(`   1. 在 ${criticalPoint} 時性能開始下降，建議優化以支持更多並發用戶`);
    console.log(`   2. 實施數據庫索引和緩存策略`);
    console.log(`   3. 考慮負載均衡和水平擴展`);
  } else {
    console.log(`   1. 系統性能穩定，可以支持大量並發用戶`);
    console.log(`   2. 繼續監控性能指標`);
  }

  console.log(`${'='.repeat(80)}\n`);
}

// 運行測試
runConcurrentLoadTest().catch(console.error);
