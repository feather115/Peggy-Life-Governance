// 手機「返回」（Android 返回鍵、LINE 內建瀏覽器的返回、iOS 邊緣滑動）先關閉覆蓋畫面，
// 而不是直接離開 app。open 期間在 history 多推一筆；按返回時呼叫 onBack，onBack 沒有真的關閉
// （例如未儲存變更的確認框按了取消）就再推回去。用 UI 按鈕關閉時自己把那一筆退掉。
// 多個同時開啟時只有最上層會收到返回。
import { useEffect, useReducer, useRef } from 'react';

const stack = [];
let ignorePops = 0;

function handlePop() {
  if (ignorePops > 0) { ignorePops -= 1; return; }
  const top = stack[stack.length - 1];
  if (!top || !top.hasEntry) return;
  top.hasEntry = false;
  top.onBack?.();
  top.rerender();
}

if (typeof window !== 'undefined') window.addEventListener('popstate', handlePop);

function release(entry) {
  const i = stack.indexOf(entry);
  if (i !== -1) stack.splice(i, 1);
  if (entry.hasEntry) {
    entry.hasEntry = false;
    ignorePops += 1;
    window.history.back();
  }
}

export function useBackClose(open, onBack) {
  const [, rerender] = useReducer((n) => n + 1, 0);
  const entryRef = useRef(null);
  if (!entryRef.current) entryRef.current = { hasEntry: false, onBack: null, rerender };

  useEffect(() => {
    const entry = entryRef.current;
    entry.onBack = onBack;
    if (!open) { release(entry); return; }
    if (!stack.includes(entry)) stack.push(entry);
    if (!entry.hasEntry) {
      window.history.pushState({ backClose: true }, '');
      entry.hasEntry = true;
    }
  });

  useEffect(() => () => release(entryRef.current), []);
}
