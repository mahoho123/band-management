import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// 定義測試設備
const devices = [
  { name: 'iPhone SE (320px)', width: 320, height: 667, deviceScaleFactor: 2 },
  { name: 'iPhone 12 (375px)', width: 375, height: 812, deviceScaleFactor: 3 },
  { name: 'Galaxy S21 (480px)', width: 480, height: 800, deviceScaleFactor: 2 },
  { name: 'iPad (768px)', width: 768, height: 1024, deviceScaleFactor: 2 },
  { name: 'iPad Landscape (1024px)', width: 1024, height: 768, deviceScaleFactor: 2 },
  { name: 'Desktop (1440px)', width: 1440, height: 900, deviceScaleFactor: 1 },
  { name: 'Large Desktop (1920px)', width: 1920, height: 1080, deviceScaleFactor: 1 },
];

// 測試頁面元素
const testElements = [
  { selector: '.glass-panel', name: '模態框' },
  { selector: 'input[type="text"]', name: '文字輸入框' },
  { selector: 'input[type="password"]', name: '密碼輸入框' },
  { selector: 'button', name: '按鈕' },
  { selector: 'label', name: '標籤' },
];

async function testResponsiveness() {
  const browser = await puppeteer.launch();
  const results = [];

  for (const device of devices) {
    console.log(`\n測試設備: ${device.name}`);
    const page = await browser.newPage();
    
    // 設置視口
    await page.setViewport({
      width: device.width,
      height: device.height,
      deviceScaleFactor: device.deviceScaleFactor,
    });

    // 訪問頁面
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // 等待登入模態框出現
    await page.waitForSelector('.glass-panel', { timeout: 5000 }).catch(() => {});

    const deviceResult = {
      device: device.name,
      width: device.width,
      height: device.height,
      tests: [],
      issues: [],
    };

    // 檢查每個元素
    for (const element of testElements) {
      try {
        const elements = await page.$$(element.selector);
        if (elements.length > 0) {
          for (let i = 0; i < Math.min(elements.length, 3); i++) {
            const boundingBox = await elements[i].boundingBox();
            if (boundingBox) {
              const isOutOfBounds = 
                boundingBox.x < 0 || 
                boundingBox.y < 0 || 
                boundingBox.x + boundingBox.width > device.width ||
                boundingBox.y + boundingBox.height > device.height;

              const fontSize = await elements[i].evaluate(el => 
                window.getComputedStyle(el).fontSize
              );

              const fontSizeNum = parseInt(fontSize);
              const isReadable = fontSizeNum >= 12;

              deviceResult.tests.push({
                element: `${element.name} #${i + 1}`,
                width: boundingBox.width.toFixed(2),
                height: boundingBox.height.toFixed(2),
                x: boundingBox.x.toFixed(2),
                y: boundingBox.y.toFixed(2),
                fontSize: fontSize,
                isReadable: isReadable,
                isOutOfBounds: isOutOfBounds,
              });

              if (isOutOfBounds) {
                deviceResult.issues.push(
                  `${element.name} #${i + 1} 超出邊界 (x: ${boundingBox.x}, y: ${boundingBox.y})`
                );
              }

              if (!isReadable) {
                deviceResult.issues.push(
                  `${element.name} #${i + 1} 文字過小 (${fontSize})`
                );
              }
            }
          }
        }
      } catch (error) {
        console.log(`  ⚠️  無法測試 ${element.name}: ${error.message}`);
      }
    }

    results.push(deviceResult);
    await page.close();
  }

  await browser.close();
  return results;
}

// 運行測試
testResponsiveness().then(results => {
  // 保存結果為 JSON
  fs.writeFileSync(
    '/home/ubuntu/band-management/test-results.json',
    JSON.stringify(results, null, 2)
  );

  // 生成報告
  console.log('\n\n========== 響應式設計測試報告 ==========\n');
  
  results.forEach(result => {
    console.log(`\n📱 ${result.device}`);
    console.log(`   解析度: ${result.width}x${result.height}`);
    
    if (result.issues.length === 0) {
      console.log('   ✅ 所有測試通過');
    } else {
      console.log(`   ❌ 發現 ${result.issues.length} 個問題:`);
      result.issues.forEach(issue => {
        console.log(`      - ${issue}`);
      });
    }
  });

  console.log('\n========== 測試完成 ==========\n');
}).catch(error => {
  console.error('測試失敗:', error);
  process.exit(1);
});
