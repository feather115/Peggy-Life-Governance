// Supabase 的純查詢函式，元件不直接打資料庫，一律透過 useEvents 拿到的 state/actions。
import { supabase } from './supabase.js';

const EVENT_COLUMNS = [
  'id',
  'user_id',
  'title',
  'description',
  'start_at',
  'end_at',
  'all_day',
  'color',
  'tags',
  'created_at',
].join(', ');

export async function loadEvents(userId) {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .eq('user_id', userId)
    .order('start_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createEvent(userId, payload) {
  const { data, error } = await supabase
    .from('events')
    .insert({ ...payload, user_id: userId })
    .select(EVENT_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(eventId, patch) {
  const { data, error } = await supabase
    .from('events')
    .update(patch)
    .eq('id', eventId)
    .select(EVENT_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(eventId) {
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) throw error;
}

// ---- 日記 ----

const DIARY_COLUMNS = [
  'id', 'user_id', 'entry_date', 'all_day', 'time', 'end_time',
  'location', 'people', 'tags', 'note', 'created_at',
].join(', ');

export async function loadDiaryEntries(userId) {
  const { data, error } = await supabase
    .from('diary_entries')
    .select(DIARY_COLUMNS)
    .eq('user_id', userId)
    .order('entry_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createDiaryEntry(userId, payload) {
  const { data, error } = await supabase
    .from('diary_entries')
    .insert({ ...payload, user_id: userId })
    .select(DIARY_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function updateDiaryEntry(entryId, patch) {
  const { data, error } = await supabase
    .from('diary_entries')
    .update(patch)
    .eq('id', entryId)
    .select(DIARY_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDiaryEntry(entryId) {
  const { error } = await supabase.from('diary_entries').delete().eq('id', entryId);
  if (error) throw error;
}

// ---- 標籤分類 ----

const CATEGORY_COLUMNS = ['id', 'user_id', 'name', 'tags', 'created_at'].join(', ');

export async function loadCategories(userId) {
  const { data, error } = await supabase
    .from('tag_categories')
    .select(CATEGORY_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createCategories(userId, categories) {
  // categories: [{ name, tags }] — 用來一次建立預設分類（新使用者首次使用時）
  const { data, error } = await supabase
    .from('tag_categories')
    .insert(categories.map((c) => ({ ...c, user_id: userId })))
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
