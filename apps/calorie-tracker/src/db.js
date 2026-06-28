import { supabase } from './supabase.js';

// ── helpers ────────────────────────────────────────────────────
function dkFrom(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

async function ensureDayRecord(userId, date) {
  const { data: existing } = await supabase
    .from('day_records').select('id').eq('user_id', userId).eq('date', date).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from('day_records').insert({ user_id: userId, date }).select('id').single();
  if (error) throw error;
  return data.id;
}

// ── full load ──────────────────────────────────────────────────
export async function loadAll(userId) {
  const [settingsRes, tagsRes, foodsRes, daysRes, usageRes] = await Promise.all([
    supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('tag_defs').select('*').eq('user_id', userId).order('sort_order'),
    supabase.from('custom_foods').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('day_records').select('id,date,day_note,day_tags(tag_def_id),meal_items(*)')
      .eq('user_id', userId).order('date', { ascending: false }),
    supabase.from('food_usage').select('food_ref,last_used_at').eq('user_id', userId),
  ]);

  const foodUsage = {};
  (usageRes.data || []).forEach(u => { foodUsage[u.food_ref] = u.last_used_at; });

  const settings = settingsRes.data || { goal_cal:1500, goal_p:110, goal_c:150, goal_f:50, display_name:null };
  const tagDefs = tagsRes.data || [];
  const mapTag = (t) => ({ id: t.id, label: t.label, color: t.color || '#E8A13C' });
  const customFoods = (foodsRes.data || []).map(f => ({
    id: f.id, name: f.name, unit: f.unit, brand: f.brand || '', note: f.note || '',
    cal: Number(f.cal), p: Number(f.p), c: Number(f.c), f: Number(f.f),
    custom: true,
  }));

  const days = {};
  for (const dr of (daysRes.data || [])) {
    const meals = { breakfast:[], lunch:[], dinner:[], snack:[], midnight:[] };
    for (const mi of dr.meal_items || []) {
      meals[mi.meal_key]?.push({
        id: mi.id,
        name: mi.name, brand: mi.brand || '', unit: mi.unit,
        cal: Number(mi.cal), p: Number(mi.p), c: Number(mi.c), f: Number(mi.f),
      });
    }
    const activeTags = (dr.day_tags || []).map(t => t.tag_def_id);
    days[dr.date] = { recordId: dr.id, meals, dayNote: dr.day_note || '', tags: { activeTags } };
  }

  return {
    displayName: settings.display_name || '',
    goalCal: settings.goal_cal, goalP: settings.goal_p, goalC: settings.goal_c, goalF: settings.goal_f,
    fastingTagDefs: tagDefs.filter(t => t.type === 'fasting').map(mapTag),
    otherTagDefs:   tagDefs.filter(t => t.type === 'other').map(mapTag),
    customFoods,
    days,
    foodUsage,
  };
}

// Logs when a food was selected/added/edited (for food library sorting: recently used foods appear at the top)
export async function touchFoodUsage(userId, foodRef) {
  if (!foodRef) return;
  await supabase.from('food_usage').upsert({ user_id: userId, food_ref: String(foodRef), last_used_at: new Date().toISOString() });
}

// ── settings ──────────────────────────────────────────────────
export async function saveSettings(userId, { goalCal, goalP, goalC, goalF, displayName }) {
  const row = {
    user_id: userId, goal_cal: goalCal, goal_p: goalP, goal_c: goalC, goal_f: goalF,
    updated_at: new Date().toISOString(),
  };
  if (displayName !== undefined) row.display_name = displayName || null;
  await supabase.from('user_settings').upsert(row);
}

// ── tag defs ──────────────────────────────────────────────────
export async function addTagDef(userId, type, label, sortOrder, color) {
  const { data, error } = await supabase.from('tag_defs')
    .insert({ user_id: userId, type, label, sort_order: sortOrder, color: color || null })
    .select('id,label,color').single();
  if (error) throw error;
  return { id: data.id, label: data.label, color: data.color || '#E8A13C' };
}
export async function updateTagDefColor(id, color) {
  const { data, error } = await supabase.from('tag_defs')
    .update({ color: color || null }).eq('id', id).select('id,label,color').single();
  if (error) throw error;
  return { id: data.id, label: data.label, color: data.color || '#E8A13C' };
}
export async function deleteTagDef(id) {
  await supabase.from('tag_defs').delete().eq('id', id);
}

// ── custom foods ──────────────────────────────────────────────
export async function addCustomFood(userId, food) {
  const { data, error } = await supabase.from('custom_foods').insert({
    user_id: userId, name: food.name, unit: food.unit,
    brand: food.brand || null, note: food.note || null,
    cal: food.cal, p: food.p, c: food.c, f: food.f,
  }).select('*').single();
  if (error) throw error;
  return { id: data.id, name: data.name, unit: data.unit, brand: data.brand || '', note: data.note || '',
    cal: Number(data.cal), p: Number(data.p), c: Number(data.c), f: Number(data.f), custom: true };
}
// Only updates the custom_foods definition; previously recorded historical meal items are snapshots and will not be affected.
export async function updateCustomFood(id, food) {
  const { data, error } = await supabase.from('custom_foods').update({
    name: food.name, unit: food.unit, brand: food.brand || null, note: food.note || null,
    cal: food.cal, p: food.p, c: food.c, f: food.f,
  }).eq('id', id).select('*').single();
  if (error) throw error;
  return { id: data.id, name: data.name, unit: data.unit, brand: data.brand || '', note: data.note || '',
    cal: Number(data.cal), p: Number(data.p), c: Number(data.c), f: Number(data.f), custom: true };
}
export async function deleteCustomFood(id) {
  await supabase.from('custom_foods').delete().eq('id', id);
}

// ── meal items (snapshot) ─────────────────────────────────────
export async function addMealItem(userId, date, mealKey, foodSnapshot) {
  const recordId = await ensureDayRecord(userId, date);
  const { data, error } = await supabase.from('meal_items').insert({
    day_record_id: recordId,
    meal_key: mealKey,
    food_ref: foodSnapshot.foodRef || null,
    name: foodSnapshot.name, brand: foodSnapshot.brand || null, unit: foodSnapshot.unit || '1 份',
    cal: foodSnapshot.cal, p: foodSnapshot.p || 0, c: foodSnapshot.c || 0, f: foodSnapshot.f || 0,
  }).select('*').single();
  if (error) throw error;
  return {
    recordId,
    item: {
      id: data.id, name: data.name, brand: data.brand || '', unit: data.unit,
      cal: Number(data.cal), p: Number(data.p), c: Number(data.c), f: Number(data.f),
    },
  };
}
export async function removeMealItem(id) {
  await supabase.from('meal_items').delete().eq('id', id);
}
// Edits an already added meal item (name/brand/unit/calories/nutrients); only modifies this specific entry without affecting other days.
export async function updateMealItem(id, patch) {
  const row = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.brand !== undefined) row.brand = patch.brand || null;
  if (patch.unit !== undefined) row.unit = patch.unit;
  if (patch.cal !== undefined) row.cal = patch.cal;
  if (patch.p !== undefined) row.p = patch.p;
  if (patch.c !== undefined) row.c = patch.c;
  if (patch.f !== undefined) row.f = patch.f;
  const { data, error } = await supabase.from('meal_items').update(row).eq('id', id).select('*').single();
  if (error) throw error;
  return { id: data.id, name: data.name, brand: data.brand || '', unit: data.unit,
    cal: Number(data.cal), p: Number(data.p), c: Number(data.c), f: Number(data.f) };
}

// ── day note ──────────────────────────────────────────────────
export async function saveDayNote(userId, date, note) {
  const recordId = await ensureDayRecord(userId, date);
  await supabase.from('day_records').update({ day_note: note, updated_at: new Date().toISOString() })
    .eq('id', recordId);
  return recordId;
}

// ── day tags ──────────────────────────────────────────────────
export async function toggleDayTag(userId, date, tagDefId, makeActive) {
  const recordId = await ensureDayRecord(userId, date);
  if (makeActive) {
    await supabase.from('day_tags').upsert({ day_record_id: recordId, tag_def_id: tagDefId });
  } else {
    await supabase.from('day_tags').delete()
      .eq('day_record_id', recordId).eq('tag_def_id', tagDefId);
  }
  return recordId;
}

// ═════════════════════════════════════════════════════════════
//  Weight Challenge
// ═════════════════════════════════════════════════════════════

function genInviteCode() {
  // 6 characters, avoiding easily confused characters (0/O, 1/I, L)
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

// Loads all challenges I participate in (including members, weight records, and member display_names)
export async function loadMyChallenges(userId) {
  // First fetch the list of challenge_ids where I am a member
  const { data: memberRows, error: memErr } = await supabase
    .from('challenge_members').select('challenge_id').eq('user_id', userId);
  if (memErr) throw memErr;
  const ids = (memberRows || []).map(r => r.challenge_id);
  if (ids.length === 0) return [];

  // Fetch all challenges including related data in one query
  const { data: rows, error } = await supabase
    .from('challenges')
    .select('id,name,start_date,end_date,status,winner_user_id,creator_user_id,invite_code,created_at,challenge_members(user_id,joined_at,color),weight_entries(id,user_id,kg_diff,week_label,recorded_at)')
    .in('id', ids)
    .order('created_at', { ascending: false });
  if (error) throw error;

  // Extract all member user_ids and query display_name + email in one go (used for fallback names)
  const allUserIds = new Set();
  rows.forEach(c => (c.challenge_members || []).forEach(m => allUserIds.add(m.user_id)));
  let infoByUser = {};
  if (allUserIds.size > 0) {
    const { data: settings, error: settingsErr } = await supabase
      .from('user_settings').select('user_id,display_name,email').in('user_id', [...allUserIds]);
    if (settingsErr) console.warn('loadMyChallenges: Failed to fetch member names', settingsErr.message);
    (settings || []).forEach(s => {
      infoByUser[s.user_id] = { displayName: s.display_name || '', email: s.email || '' };
    });
  }
  // Nickname takes precedence; if not set, use email @ prefix; otherwise "Unnamed"
  const resolveName = (userId) => {
    const info = infoByUser[userId];
    if (!info) return '未命名';
    if (info.displayName) return info.displayName;
    if (info.email) return '@' + info.email.split('@')[0];
    return '未命名';
  };

  return rows.map(c => ({
    id: c.id, name: c.name,
    startDate: c.start_date, endDate: c.end_date,
    status: c.status, winnerUserId: c.winner_user_id,
    creatorUserId: c.creator_user_id, inviteCode: c.invite_code,
    createdAt: c.created_at,
    members: (c.challenge_members || []).map(m => ({
      userId: m.user_id,
      name: resolveName(m.user_id),
      color: m.color || null,
      joinedAt: m.joined_at,
    })),
    entries: (c.weight_entries || []).map(e => ({
      id: e.id, userId: e.user_id, kgDiff: Number(e.kg_diff),
      weekLabel: e.week_label, recordedAt: e.recorded_at,
    })),
  }));
}

export async function createChallenge(userId, { name, startDate, endDate }) {
  // Retry up to 5 times to avoid invite_code collisions
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = genInviteCode();
    const { data, error } = await supabase
      .from('challenges')
      .insert({ name, start_date: startDate, end_date: endDate, creator_user_id: userId, invite_code: code })
      .select('id,invite_code').single();
    if (!error) {
      // Creator automatically joins as a member
      await supabase.from('challenge_members').insert({ challenge_id: data.id, user_id: userId });
      return data.id;
    }
    if (error.code !== '23505') throw error; // Throw immediately if it's not a unique violation
  }
  throw new Error('產生邀請碼失敗，請重試');
}

export async function joinChallengeByCode(userId, code) {
  // Query via RPC (security definer) because non-members cannot read the challenges table due to RLS restrictions
  const { data: rows, error } = await supabase.rpc('find_challenge_by_code', { p_code: code });
  if (error) throw error;
  const ch = rows && rows[0];
  if (!ch) throw new Error('找不到這個邀請碼');
  // Attempt to join (duplicate joining is blocked by primary key, but not treated as an error)
  const { error: joinErr } = await supabase
    .from('challenge_members').insert({ challenge_id: ch.id, user_id: userId });
  if (joinErr && joinErr.code !== '23505') throw joinErr;
  return ch.id;
}

// Member customizes their own color in this challenge (used for charts/podium avatars); passing null for colorHex restores the default
export async function setMemberColor(userId, challengeId, colorHex) {
  const { error } = await supabase
    .from('challenge_members').update({ color: colorHex })
    .eq('challenge_id', challengeId).eq('user_id', userId);
  if (error) throw error;
}

export async function leaveChallenge(userId, challengeId) {
  await supabase.from('challenge_members').delete()
    .eq('challenge_id', challengeId).eq('user_id', userId);
}

// Only creator can modify (enforced by RLS); patch can contain name / start_date / end_date
export async function updateChallenge(challengeId, patch) {
  const row = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.startDate !== undefined) row.start_date = patch.startDate;
  if (patch.endDate !== undefined) row.end_date = patch.endDate;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from('challenges').update(row).eq('id', challengeId);
  if (error) throw error;
}

export async function endChallenge(challengeId, winnerUserId) {
  const { error } = await supabase
    .from('challenges')
    .update({ status: 'ended', winner_user_id: winnerUserId })
    .eq('id', challengeId);
  if (error) throw error;
}

export async function deleteChallenge(challengeId) {
  await supabase.from('challenges').delete().eq('id', challengeId);
}

export async function upsertWeightEntry(userId, { challengeId, kgDiff, weekLabel }) {
  // If the entry for the same week already exists -> update it, otherwise insert a new record
  const { data: existing } = await supabase
    .from('weight_entries').select('id')
    .eq('challenge_id', challengeId).eq('user_id', userId).eq('week_label', weekLabel).maybeSingle();
  if (existing) {
    const { data, error } = await supabase
      .from('weight_entries').update({ kg_diff: kgDiff, recorded_at: new Date().toISOString() })
      .eq('id', existing.id).select('*').single();
    if (error) throw error;
    return { id: data.id, userId, kgDiff: Number(data.kg_diff), weekLabel: data.week_label, recordedAt: data.recorded_at };
  }
  const { data, error } = await supabase.from('weight_entries').insert({
    challenge_id: challengeId, user_id: userId, kg_diff: kgDiff, week_label: weekLabel,
  }).select('*').single();
  if (error) throw error;
  return { id: data.id, userId, kgDiff: Number(data.kg_diff), weekLabel: data.week_label, recordedAt: data.recorded_at };
}

export async function deleteWeightEntry(entryId) {
  await supabase.from('weight_entries').delete().eq('id', entryId);
}
