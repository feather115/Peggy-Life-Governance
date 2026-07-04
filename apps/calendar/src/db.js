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
