// Supabase 的純查詢函式，元件不直接打資料庫，一律透過 useRecords 拿到的 state/actions。
import { supabase } from './supabase.js';

// 「紀錄」＝合併後的單一實體（events 表）：計畫面欄位（title/color/description/tags）+
// 回顧面欄位（note/diary_tags/tag_details/hashtags），時間統一 start_at / end_at。
const RECORD_COLUMNS = [
  'id',
  'user_id',
  'title',
  'description',
  'note',
  'locations',
  'people',
  'start_at',
  'end_at',
  'all_day',
  'color',
  'tags',
  'diary_tags',
  'tag_details',
  'hashtags',
  'created_at',
].join(', ');

export async function loadRecords(userId) {
  const { data, error } = await supabase
    .from('events')
    .select(RECORD_COLUMNS)
    .eq('user_id', userId)
    .order('start_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createRecord(userId, payload) {
  const { data, error } = await supabase
    .from('events')
    .insert({ ...payload, user_id: userId })
    .select(RECORD_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function updateRecord(recordId, patch) {
  const { data, error } = await supabase
    .from('events')
    .update(patch)
    .eq('id', recordId)
    .select(RECORD_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRecord(recordId) {
  const { error } = await supabase.from('events').delete().eq('id', recordId);
  if (error) throw error;
}

// ---- 標籤分類 ----

const CATEGORY_COLUMNS = ['id', 'user_id', 'name', 'tags', 'sort_order', 'created_at'].join(', ');

export async function loadCategories(userId) {
  const { data, error } = await supabase
    .from('tag_categories')
    .select(CATEGORY_COLUMNS)
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createCategories(userId, categories, startSortOrder = 0) {
  // categories: [{ name, tags }] — 用來一次建立預設分類（新使用者首次使用時）或新增單一分類
  const { data, error } = await supabase
    .from('tag_categories')
    .insert(categories.map((c, i) => ({ ...c, user_id: userId, sort_order: startSortOrder + i })))
    .select(CATEGORY_COLUMNS);
  if (error) throw error;
  return data || [];
}

export async function updateCategory(categoryId, patch) {
  const { data, error } = await supabase
    .from('tag_categories')
    .update(patch)
    .eq('id', categoryId)
    .select(CATEGORY_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(categoryId) {
  const { error } = await supabase.from('tag_categories').delete().eq('id', categoryId);
  if (error) throw error;
}

// ---- 選項庫（地點/人名/事件標籤，設定頁「管理地點、人名與標籤」維護）----

const OPTION_COLUMNS = ['id', 'user_id', 'kind', 'name', 'parent_id', 'archived', 'created_at'].join(', ');

export async function loadOptions(userId) {
  const { data, error } = await supabase
    .from('event_options')
    .select(OPTION_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createOptions(userId, rows) {
  // rows: [{ kind, name, parent_id? }]
  const { data, error } = await supabase
    .from('event_options')
    .insert(rows.map((r) => ({ ...r, user_id: userId })))
    .select(OPTION_COLUMNS);
  if (error) throw error;
  return data || [];
}

export async function updateOption(optionId, patch) {
  const { data, error } = await supabase
    .from('event_options')
    .update(patch)
    .eq('id', optionId)
    .select(OPTION_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteOption(optionId) {
  const { error } = await supabase.from('event_options').delete().eq('id', optionId);
  if (error) throw error;
}

// ---- 週期性任務 ----

const TASK_COLUMNS = [
  'id', 'user_id', 'title', 'interval_value', 'interval_unit',
  'next_due', 'last_done', 'show_on_calendar', 'history', 'created_at',
].join(', ');

export async function loadTasks(userId) {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_COLUMNS)
    .eq('user_id', userId)
    .order('next_due', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createTask(userId, payload) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...payload, user_id: userId })
    .select(TASK_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(taskId, patch) {
  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', taskId)
    .select(TASK_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(taskId) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw error;
}

// ---- 使用者暱稱（跨 app 共用，見 packages/shared/supabase/2026-07-06_shared_user_profiles.sql）----
// `.schema('shared')` 是同一個 client 換個查詢目標 schema，不是另開一個 client，
// 不會有 supabase-js 的 Multiple GoTrueClient 警告。

export async function loadMyDisplayName(userId) {
  const { data, error } = await supabase
    .schema('shared')
    .from('user_profiles')
    .select('display_name')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.display_name || '';
}

export async function updateDisplayName(userId, displayName) {
  const { data, error } = await supabase
    .schema('shared')
    .from('user_profiles')
    .update({ display_name: displayName || null })
    .eq('user_id', userId)
    .select('display_name')
    .single();
  if (error) throw error;
  return data;
}
