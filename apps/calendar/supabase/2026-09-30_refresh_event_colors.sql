-- 行事曆預設 7 色改成清新色系（見 src/theme.js 的 EVENT_COLORS），把舊紀錄用的舊預設色
-- 依「第幾個顏色」對應換成新色：藍→天空藍、青→湖水綠、綠→嫩芽綠、橄欖→蜂蜜黃、
-- 棕→蜜桃橘、紫→薰衣草、梅→櫻花粉。自訂色碼、沒設顏色的紀錄都不動。
--
-- 選擇性執行：不跑的話舊紀錄維持原本的暗色，編輯時會顯示成「自訂」顏色，功能不受影響。
-- 在 Supabase SQL Editor 手動執行。會直接改寫顏色，執行前可先跑最下面的預覽查詢看影響筆數。

update calendar.events
set color = case upper(color)
  when '#3D5A80' then '#5497E3'
  when '#3D8073' then '#27A594'
  when '#4F8052' then '#4EA651'
  when '#8C7A3D' then '#C68910'
  when '#8C5A3D' then '#ED6C45'
  when '#6B3D80' then '#9787E8'
  when '#803D5A' then '#E56C9C'
end
where upper(color) in ('#3D5A80', '#3D8073', '#4F8052', '#8C7A3D', '#8C5A3D', '#6B3D80', '#803D5A');

-- 預覽（執行 update 前先跑這段，看每個舊色有幾筆）：
-- select upper(color) as old_color, count(*) from calendar.events
-- where upper(color) in ('#3D5A80', '#3D8073', '#4F8052', '#8C7A3D', '#8C5A3D', '#6B3D80', '#803D5A')
-- group by 1 order by 2 desc;
