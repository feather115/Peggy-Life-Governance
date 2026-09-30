// 手機「返回」（Android 返回鍵、LINE 內建瀏覽器的返回、iOS 邊緣滑動）先關閉覆蓋畫面，
// 而不是直接離開 app。open 期間在 history 多推一筆；按返回時呼叫 onBack，onBack 沒有真的關閉
// （例如未儲存變更的確認框按了取消）就再推回去。用 UI 按鈕關閉時自己把那一筆退掉。
//
// 每一筆都在 history.state 記自己的層數（bcDepth）。popstate 時看退到第幾層，比那層深、而且還以為
// 自己在 history 裡的，就是被返回鍵退掉的。不用「忽略下一次 popstate」計數：同時關兩層（確認框 +
// 表單）時瀏覽器可能把兩次 history.back() 合成一次，計數就會對不上，下一次返回鍵會失效。
import { useEffect, useReducer, useRef } from 'react';

const stack = [];
let depth = (typeof window !== 'undefined' && window.history.state?.bcDepth) || 0;
let trimQueued = false;

function handlePop(e) {
  const now = e.state?.bcDepth || 0;
  depth = now;
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const entry = stack[i];
    if (entry.hasEntry && entry.depth > now) {
      entry.hasEntry = false;
      entry.onBack?.();
      entry.rerender();
    }
  }
}

if (typeof window !== 'undefined') window.addEventListener('popstate', handlePop);

// UI 關閉後把多出來的 history 退掉；同一輪關掉好幾層時合併成一次 history.go(-n)
function trimHistory() {
  if (trimQueued) return;
  trimQueued = true;
  queueMicrotask(() => {
    trimQueued = false;
    const keep = Math.max(0, ...stack.filter((e) => e.hasEntry).map((e) => e.depth));
    if (depth <= keep) return;
    // depth 先更新：瀏覽器的 popstate 還沒回來前若又有一層關閉，才不會用舊的層數再退一次、退出 app
    const delta = keep - depth;
    depth = keep;
    window.history.go(delta);
  });
}

function release(entry) {
  const i = stack.indexOf(entry);
  if (i !== -1) stack.splice(i, 1);
  if (entry.hasEntry) {
    entry.hasEntry = false;
    trimHistory();
  }
}

export function useBackClose(open, onBack) {
  const [, rerender] = useReducer((n) => n + 1, 0);
  const entryRef = useRef(null);
  if (!entryRef.current) entryRef.current = { hasEntry: false, depth: 0, onBack: null, rerender };

  useEffect(() => {
    const entry = entryRef.current;
    entry.onBack = onBack;
    if (!open) { release(entry); return; }
    if (!stack.includes(entry)) stack.push(entry);
    if (!entry.hasEntry) {
      depth += 1;
      window.history.pushState({ bcDepth: depth }, '');
      entry.depth = depth;
      entry.hasEntry = true;
    }
  });

  useEffect(() => () => release(entryRef.current), []);
}
