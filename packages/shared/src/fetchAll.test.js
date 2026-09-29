import { describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { fetchAll } from './fetchAll.js';

// 用真的 supabase-js client + 假的 fetch 模擬 PostgREST：照 offset/limit 回傳，且每次最多 maxRows 筆
function fakeSupabase(total, { maxRows = 1000, failAt = null } = {}) {
  const rows = Array.from({ length: total }, (_, i) => ({ id: i + 1 }));
  const requests = [];
  const fetch = async (url) => {
    const u = new URL(url);
    requests.push(u);
    const offset = Number(u.searchParams.get('offset') || 0);
    if (offset === failAt) {
      return new Response(JSON.stringify({ message: 'boom', code: 'XX000' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const limit = Math.min(Number(u.searchParams.get('limit') || Infinity), maxRows);
    return new Response(JSON.stringify(rows.slice(offset, offset + limit)), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const supabase = createClient('http://localhost:54321', 'anon-key', {
    global: { fetch },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const query = () => supabase.from('events').select('id').eq('user_id', 'u1').order('start_at').order('id');
  return { query, requests };
}

describe('fetchAll', () => {
  it('超過 1000 筆時分頁抓完，不會被截掉', async () => {
    const { query, requests } = fakeSupabase(2500);
    const rows = await fetchAll(query);
    expect(rows).toHaveLength(2500);
    expect(rows.at(-1).id).toBe(2500);
    expect(requests.map((u) => u.searchParams.get('offset'))).toEqual(['0', '1000', '2000']);
    expect(requests[0].searchParams.get('order')).toBe('start_at.asc,id.asc');
  });

  it('剛好整頁時多問一次確認已經到底', async () => {
    const { query, requests } = fakeSupabase(2000);
    expect(await fetchAll(query)).toHaveLength(2000);
    expect(requests).toHaveLength(3);
  });

  it('資料少於一頁只打一次', async () => {
    const { query, requests } = fakeSupabase(3);
    expect(await fetchAll(query)).toHaveLength(3);
    expect(requests).toHaveLength(1);
  });

  it('任何一頁失敗就丟錯，不回傳半套資料', async () => {
    const { query } = fakeSupabase(2500, { failAt: 1000 });
    await expect(fetchAll(query)).rejects.toMatchObject({ message: 'boom' });
  });
});
