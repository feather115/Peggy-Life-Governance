// PostgREST 每個請求最多只回傳專案的 Max rows（Supabase 預設 1000）筆，超過的部分會被靜默截掉、
// 不會報錯。會隨使用無限成長的表（行事曆紀錄、每日飲食紀錄、料理紀錄）一律用這個分頁抓完。
//
// buildQuery：每次呼叫都要回傳一個新的 query（select / filter / order 都設好，不要自己加 range）。
// 排序必須能唯一決定順序（最後補一個主鍵排序），不然分頁之間可能重複或漏資料。
// pageSize 不能大於 Supabase Dashboard 的 Max rows 設定，否則第一頁就被截短、會提早結束。
export async function fetchAll(buildQuery, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < pageSize) return rows;
  }
}
