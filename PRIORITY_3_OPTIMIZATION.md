# 優先級 3 優化實施指南

## 📋 概述

優先級 3 優化包括前端 API 優化和後端微調，預期提升 10-20% 性能，支持 200+ 用戶。

---

## 🎯 前端 API 優化

### 1. 批量 API 調用優化

**當前問題：** 初始化時分別調用 getMembers、getEvents、getHolidays

**優化方案：** 使用 Promise.all 並發調用

```typescript
// 優化前：順序調用
const members = await trpc.band.getMembers.useQuery();
const events = await trpc.band.getEvents.useQuery();
const holidays = await trpc.band.getHolidays.useQuery();

// 優化後：並發調用
const [members, events, holidays] = await Promise.all([
  trpc.band.getMembers.useQuery(),
  trpc.band.getEvents.useQuery(),
  trpc.band.getHolidays.useQuery(),
]);
```

**預期效果：** 初始加載時間 ↓ 30-40%

### 2. 樂觀更新優化

**當前問題：** 出席狀態改變時，等待服務器響應後才更新 UI

**優化方案：** 立即更新 UI，失敗時回滾

```typescript
// 優化前：等待服務器響應
const { mutate } = trpc.band.setAttendance.useMutation({
  onSuccess: () => {
    trpc.useUtils().band.getEvents.invalidate();
  }
});

// 優化後：樂觀更新
const { mutate } = trpc.band.setAttendance.useMutation({
  onMutate: async (newData) => {
    // 立即更新 UI
    await trpc.useUtils().band.getEvents.cancel();
    const previousData = trpc.useUtils().band.getEvents.getData();
    
    trpc.useUtils().band.getEvents.setData(undefined, (old) => {
      // 更新本地數據
      return updateEventAttendance(old, newData);
    });
    
    return { previousData };
  },
  onError: (err, newData, context) => {
    // 失敗時回滾
    if (context?.previousData) {
      trpc.useUtils().band.getEvents.setData(undefined, context.previousData);
    }
  }
});
```

**預期效果：** UI 響應速度 ↑ 100%（立即反應）

### 3. 減少不必要的 API 查詢

**當前問題：** 可能存在重複查詢或不必要的查詢

**優化方案：**
- 檢查是否有重複的 useQuery 調用
- 使用 staleTime 和 gcTime 避免頻繁重新獲取
- 使用 enabled 條件查詢

```typescript
// 優化：設置合理的 staleTime
const { data: events } = trpc.band.getEvents.useQuery(undefined, {
  staleTime: 5 * 60 * 1000, // 5 分鐘內不重新獲取
  gcTime: 10 * 60 * 1000,   // 10 分鐘後清除緩存
});

// 優化：條件查詢
const { data: eventDetails } = trpc.band.getEventDetails.useQuery(
  { eventId: selectedEventId },
  {
    enabled: !!selectedEventId, // 只在 selectedEventId 存在時查詢
  }
);
```

**預期效果：** API 調用次數 ↓ 20-30%

---

## 🔧 後端微調

### 1. 啟用 gzip 壓縮

**當前問題：** 響應體積較大，傳輸時間長

**優化方案：** 在 Express 中啟用 gzip 壓縮

```typescript
// server/_core/index.ts
import compression from 'compression';

app.use(compression({
  level: 6, // 1-9，6 是平衡點
  threshold: 1024, // 只壓縮 > 1KB 的響應
}));
```

**預期效果：** 響應體積 ↓ 60-80%，傳輸時間 ↓ 50-70%

### 2. 優化 JSON 序列化

**當前問題：** 大量數據序列化時消耗 CPU

**優化方案：** 使用 superjson 的優化配置

```typescript
// 確保只序列化必要的字段
export const getMembers = publicProcedure.query(async ({ ctx }) => {
  const members = await ctx.db.query.bandMembers.findMany();
  
  // 只返回必要的字段
  return members.map(m => ({
    id: m.id,
    name: m.name,
    instrument: m.instrument,
    // 不返回 password 等敏感信息
  }));
});
```

**預期效果：** 序列化時間 ↓ 15-20%

### 3. 優化響應頭

**當前問題：** 缺少緩存相關的響應頭

**優化方案：** 添加緩存相關的響應頭

```typescript
// server/_core/index.ts
app.use((req, res, next) => {
  // 設置緩存頭
  res.set('Cache-Control', 'public, max-age=3600');
  
  // 設置 ETag 以支持條件請求
  res.set('ETag', `"${Date.now()}"`);
  
  // 啟用 HTTP/2 Server Push（如果支持）
  res.set('Link', '</api/trpc/band.getMembers>; rel=preload; as=fetch');
  
  next();
});
```

**預期效果：** 重複請求時間 ↓ 90%（使用本地緩存）

---

## 📊 預期優化效果

### 性能改進

| 優化項 | 預期改進 | 實施難度 |
|--------|--------|--------|
| 批量 API 調用 | 初始加載 ↓ 30-40% | 低 |
| 樂觀更新 | UI 響應 ↑ 100% | 中 |
| 減少查詢 | API 調用 ↓ 20-30% | 低 |
| gzip 壓縮 | 傳輸 ↓ 50-70% | 低 |
| JSON 優化 | 序列化 ↓ 15-20% | 低 |
| 響應頭優化 | 重複請求 ↓ 90% | 低 |

**總體預期改進：10-20%**

### 用戶體驗改進

- 初始加載速度更快
- 按鈕點擊反應更快
- 減少 API 調用次數
- 支持 200+ 用戶

---

## 🧪 驗證方法

### 優化前後對比

```bash
# 優化前測試
node concurrent-load-test.mjs > before.txt

# 實施優化

# 優化後測試
node concurrent-load-test.mjs > after.txt

# 對比結果
diff before.txt after.txt
```

### 預期結果

| 用戶數 | 優化前 | 優化後 | 改進 |
|--------|--------|--------|------|
| 50 | 1043ms | 850-900ms | ↓ 15-20% |
| 100 | 2008ms | 1600-1700ms | ↓ 15-20% |
| 200 | N/A | 2500-3000ms | 新支持 |

---

## 📝 實施清單

- [ ] 實施前端批量 API 調用
- [ ] 實施樂觀更新
- [ ] 檢查並移除重複查詢
- [ ] 啟用 gzip 壓縮
- [ ] 優化 JSON 序列化
- [ ] 添加緩存相關響應頭
- [ ] 運行優化後測試
- [ ] 驗證性能改進
- [ ] 更新文檔

---

## 💡 其他建議

### 短期（1-2 週）
- 實施上述優化
- 監控性能指標
- 收集用戶反饋

### 中期（2-4 週）
- 實施優先級 1 和 2 的優化
- 添加性能監控
- 優化數據庫查詢

### 長期（1-3 個月）
- 考慮水平擴展
- 實施 CDN
- 優化前端打包大小
