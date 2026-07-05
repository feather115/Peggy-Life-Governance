-- 給「某些標籤想加細節」用（例如「追劇」想記是哪部劇）。
-- 不改 tags 本身的結構（還是 text[]，跟分類定義的 tags 共用同一套字串），
-- 另外開一個 tag -> 細節文字 的 map，只有真的填了細節的標籤才會有 key。
alter table calendar.diary_entries add column if not exists tag_details jsonb not null default '{}'::jsonb;
