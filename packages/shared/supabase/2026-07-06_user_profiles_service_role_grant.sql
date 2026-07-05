-- ============================================================
--  shared.user_profiles — 補 service_role 的表權限
--
--  LINE 首次自動登入時，伺服器端（api/_lineLogin.js，用 service_role 的 admin client）
--  會把 LINE 顯示名稱 seed 進 shared.user_profiles（僅在暱稱空白時）。
--  service_role 雖然有 BYPASSRLS，但表層級的 GRANT 還是要有——
--  shared.line_links 當初有 grant 給 service_role，user_profiles 漏了，補上。
--
--  ⚠️ 跑這支之前要先跑過：2026-07-06_shared_user_profiles.sql
-- ============================================================

grant select, insert, update on shared.user_profiles to service_role;
