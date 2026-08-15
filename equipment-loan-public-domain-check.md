# 器材借用平台公開網址檢查

目前 iframe 預覽來源：

`https://3000-ibgzp8tw0hj5g5upaaqqf-04f8f53b.sg1.manus.computer/embed`

此網址是 Manus preview domain，會在手機或分享模式顯示「This page is not live and cannot be shared directly. Please publish to get a public link.」。

已檢查現有 Band 管理系統公開 domains：

- `https://adagio.manus.space/embed`：404 Page Not Found。
- `https://bandmanage-nisjjqwq.manus.space/embed`：404 Page Not Found。

結論：目前手上的兩個公開 domain 都不是器材借用平台的 production host，不能直接替換 iframe。需要器材借用平台本身的正式公開 domain，或先將該獨立平台發布後取得公開網址。
