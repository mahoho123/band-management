# 器材借用導覽列排查結果

已比較正式網站兩條路由：

| 路由 | 顯示結果 |
|---|---|
| `https://slowbeat-ren-bspj3tdd.manus.space/` | 顯示完整 Header 及「概覽／器材目錄／申請借用／借用紀錄」分頁；瀏覽器互動元素包含 5、6、7、8 對應分頁。 |
| `https://slowbeat-ren-bspj3tdd.manus.space/embed` | 只有平台 Logo、登入帳戶及內容；沒有「概覽／器材目錄／申請借用／借用紀錄」分頁。 |

結論：問題不是父頁面 iframe 寬度、CSS overflow 或父頁面 media query；`/embed` 路由本身就是精簡嵌入版，刻意省略平台內部導覽。獨立開啟根網址則正常顯示完整導覽。因此最小修正是將 Band 系統 iframe source 從 `/embed` 改為正式根網址，並保留現有 iframe responsive sizing。嵌入後會載入完整 Header／分頁，分頁點擊會在 iframe 內正常導航。
