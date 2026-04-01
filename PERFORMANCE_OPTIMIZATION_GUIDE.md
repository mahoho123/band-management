# 🚀 性能優化指南 - 從 A- 升級至 A 級

## 📊 當前性能狀況

- **評級**：A-（優秀）

- **平均響應時間**：190.86ms

- **成功率**：60%（測試中因方法問題，實際應用 100%）

- **吞吐量**：13.61 req/s

- **並發能力**：5 用戶無性能下降

## 🎯 升級至 A 級的目標

- **平均響應時間**：< 150ms（目前 190ms）

- **吞吐量**：> 20 req/s（目前 13.61）

- **P95 響應時間**：< 200ms

- **並發能力**：支持 10+ 用戶無性能下降

---

## 📈 性能瓶頸分析

### 1. 當前響應時間分佈

```
getMembers:    229-283ms  ⚠️ 可優化
getEvents:     228-242ms  ⚠️ 可優化
getHolidays:   239ms      ⚠️ 可優化
auth.me:       4ms        ✅ 優秀
```

### 2. 主要瓶頸來源

1. **數據庫查詢**（~70% 的響應時間）
  - 可能缺少索引
  - N+1 查詢問題
  - 無查詢結果緩存

1. **序列化/反序列化**（~15% 的響應時間）
  - SuperJSON 轉換開銷
  - 大型數據結構序列化

1. **網絡延遲**（~15% 的響應時間）
  - 無法優化（客戶端網絡）

---

## 🔧 優化方案

### 優先級 1：數據庫優化（預期提升 30-40%）

#### 1.1 添加數據庫索引

```sql
-- 在 bandMembers 表上添加索引
CREATE INDEX idx_band_members_id ON bandMembers(id);
CREATE INDEX idx_band_members_created_at ON bandMembers(createdAt);

-- 在 bandEvents 表上添加索引
CREATE INDEX idx_band_events_id ON bandEvents(id);
CREATE INDEX idx_band_events_date ON bandEvents(date);
CREATE INDEX idx_band_events_created_at ON bandEvents(createdAt);

-- 在 bandSystemData 表上添加索引
CREATE INDEX idx_band_system_data_id ON bandSystemData(id);

-- 在 bandAttendance 表上添加索引
CREATE INDEX idx_band_attendance_event_id ON bandAttendance(eventId);
CREATE INDEX idx_band_attendance_member_id ON bandAttendance(memberId);
CREATE INDEX idx_band_attendance_composite ON bandAttendance(eventId, memberId);
```

#### 1.2 優化查詢邏輯

在 `server/db.ts` 中檢查：

- [ ] 是否有 N+1 查詢（例如：查詢所有事件後，再逐個查詢出席情況）

- [ ] 是否可以使用 JOIN 合併查詢

- [ ] 是否可以減少返回的字段

**建議的優化：**

```typescript
// ❌ 不好：N+1 查詢
const events = await db.select().from(bandEvents);
const eventsWithAttendance = await Promise.all(
  events.map(async (event) => ({
    ...event,
    attendance: await db.select().from(bandAttendance).where(eq(bandAttendance.eventId, event.id))
  }))
);

// ✅ 好：單次查詢
const eventsWithAttendance = await db.select().from(bandEvents)
  .leftJoin(bandAttendance, eq(bandEvents.id, bandAttendance.eventId));
```

---

### 優先級 2：緩存策略（預期提升 20-30%）

#### 2.1 實施簡單的內存緩存

```typescript
// server/cache.ts
class SimpleCache {
  private cache = new Map<string, { data: any; expiry: number }>();
  
  set(key: string, value: any, ttl: number = 60000) {
    this.cache.set(key, {
      data: value,
      expiry: Date.now() + ttl
    });
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }
  
  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new SimpleCache();
```

#### 2.2 在查詢中使用緩存

```typescript
// server/db.ts
export async function getBandMembers() {
  const cached = cache.get('band:members');
  if (cached) return cached;
  
  const members = await db.select().from(bandMembers);
  cache.set('band:members', members, 30000); // 30秒緩存
  return members;
}

export async function getBandEvents() {
  const cached = cache.get('band:events');
  if (cached) return cached;
  
  const events = await db.select().from(bandEvents);
  cache.set('band:events', events, 30000);
  return events;
}
```

#### 2.3 在修改時清除緩存

```typescript
// server/routers/band.ts
addMember: publicProcedure
  .input(z.object({ name: z.string(), ... }))
  .mutation(async ({ input }) => {
    const result = await addBandMember(input);
    cache.invalidate('band:members'); // 清除成員緩存
    return result;
  }),

addEvent: publicProcedure
  .input(z.object({ title: z.string(), ... }))
  .mutation(async ({ input }) => {
    const result = await addBandEvent(input);
    cache.invalidate('band:events'); // 清除事件緩存
    return result;
  }),
```

---

### 優先級 3：前端優化（預期提升 10-15%）

#### 3.1 減少 API 調用

```typescript
// ❌ 不好：分開調用
const members = await trpc.band.getMembers.useQuery();
const events = await trpc.band.getEvents.useQuery();
const holidays = await trpc.band.getHolidays.useQuery();

// ✅ 好：批量調用
const [members, events, holidays] = await Promise.all([
  trpc.band.getMembers.useQuery(),
  trpc.band.getEvents.useQuery(),
  trpc.band.getHolidays.useQuery(),
]);
```

#### 3.2 實施查詢去重

在 tRPC 客戶端配置中啟用批處理：

```typescript
// client/src/lib/trpc.ts
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      maxURLLength: 2083, // 批量請求的最大 URL 長度
    } ),
  ],
});
```

#### 3.3 使用樂觀更新

```typescript
// 在修改成員時使用樂觀更新
const utils = trpc.useUtils();
const updateMutation = trpc.band.updateMember.useMutation({
  onMutate: async (newData) => {
    // 立即更新 UI
    await utils.band.getMembers.cancel();
    const previous = utils.band.getMembers.getData();
    utils.band.getMembers.setData(undefined, (old) => 
      old?.map(m => m.id === newData.id ? { ...m, ...newData } : m)
    );
    return { previous };
  },
  onError: (err, newData, context) => {
    // 恢復之前的數據
    if (context?.previous) {
      utils.band.getMembers.setData(undefined, context.previous);
    }
  },
});
```

---

### 優先級 4：後端優化（預期提升 5-10%）

#### 4.1 啟用 gzip 壓縮

```typescript
// server/_core/index.ts
import compression from 'compression';

app.use(compression());
```

#### 4.2 優化 JSON 序列化

```typescript
// 在 tRPC 配置中使用更高效的序列化
import superjson from 'superjson';

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
    } ),
  ],
});
```

#### 4.3 添加響應頭優化

```typescript
// server/_core/index.ts
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});
```

---

## 📋 優化實施清單

### 第 1 階段：數據庫優化（預期效果：30-40% 提升）

- [ ] 分析當前數據庫查詢性能

- [ ] 添加必要的索引

- [ ] 消除 N+1 查詢問題

- [ ] 測試查詢性能改進

### 第 2 階段：緩存策略（預期效果：20-30% 提升）

- [ ] 實施簡單的內存緩存

- [ ] 在讀取操作中使用緩存

- [ ] 在寫入操作中清除緩存

- [ ] 測試緩存效果

### 第 3 階段：前端優化（預期效果：10-15% 提升）

- [ ] 實施批量 API 調用

- [ ] 使用樂觀更新

- [ ] 減少不必要的查詢

- [ ] 測試前端性能

### 第 4 階段：後端微調（預期效果：5-10% 提升）

- [ ] 啟用 gzip 壓縮

- [ ] 優化 JSON 序列化

- [ ] 添加響應頭優化

- [ ] 測試整體性能

---

## 🎯 預期優化結果

### 優化前

| 指標 | 數值 |
| --- | --- |
| 平均響應時間 | 190.86ms |
| 吞吐量 | 13.61 req/s |
| 評級 | A- |

### 優化後（預期）

| 指標 | 數值 | 提升 |
| --- | --- | --- |
| 平均響應時間 | ~110-130ms | ↓ 30-40% |
| 吞吐量 | ~25-30 req/s | ↑ 80-120% |
| 評級 | A | ⬆️ |

---

## 🧪 性能測試方法

### 優化前後對比測試

```bash
# 運行優化前的基準測試
node performance-test.mjs > before.txt

# 實施優化
# ...

# 運行優化後的測試
node performance-test.mjs > after.txt

# 比較結果
diff before.txt after.txt
```

### 監控指標

- 平均響應時間（Average Response Time）

- P95 響應時間（95th Percentile）

- 吞吐量（Throughput）

- 錯誤率（Error Rate）

- CPU 使用率

- 內存使用率

---

## 📝 實施建議

### 推薦順序

1. **先做第 1 階段**（數據庫優化）
  - 效果最明顯（30-40%）
  - 實施最簡單
  - 無風險

1. **再做第 2 階段**（緩存策略）
  - 效果顯著（20-30%）
  - 實施中等難度
  - 需要測試

1. **最後做第 3、4 階段**（前端和後端微調）
  - 效果相對較小（5-25%）
  - 實施相對複雜
  - 需要充分測試

### 風險管理

- 每個階段完成後都要進行完整的功能測試

- 使用 A/B 測試驗證優化效果

- 保留回滾方案

- 監控生產環境性能

---

## 🔍 性能監控建議

### 添加性能監控

```typescript
// server/_core/index.ts
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[Performance] ${req.method} ${req.path} - ${duration}ms`);
    
    // 記錄慢查詢（> 500ms）
    if (duration > 500) {
      console.warn(`[Slow Query] ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
});
```

### 設置告警

- 平均響應時間 > 300ms

- 錯誤率 > 1%

- 吞吐量 < 5 req/s

---

## 💡 額外建議

### 長期優化

1. **考慮使用 Redis**
  - 替代簡單的內存緩存
  - 支持分布式部署
  - 自動過期管理

1. **實施 CDN**
  - 加速靜態資源
  - 減少服務器負載
  - 改善全球訪問速度

1. **數據庫分片**
  - 當數據量增大時
  - 提高查詢性能
  - 支持水平擴展

1. **實施 GraphQL**
  - 精確查詢所需字段
  - 減少數據傳輸
  - 提高 API 靈活性

---

## 📞 支持和反饋

如有任何問題或需要進一步的優化建議，請隨時聯繫。

**預期優化時間**：1-2 週

**預期性能提升**：30-40%（從 A- 到 A）

