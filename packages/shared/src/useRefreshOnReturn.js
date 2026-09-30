// 切到別的 app（LINE 聊天、鎖螢幕）超過 minAwayMs 再回來時呼叫 onReturn，靜默重新抓資料：
// 在另一台裝置或 LINE 裡改過的東西，不用手動重新整理就會出現。短暫切出去不觸發，避免一直重抓。
import { useEffect, useRef } from 'react';

export function useRefreshOnReturn(onReturn, minAwayMs = 30000) {
  const onReturnRef = useRef(onReturn);
  useEffect(() => { onReturnRef.current = onReturn; });

  useEffect(() => {
    let hiddenAt = null;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); return; }
      if (hiddenAt !== null && Date.now() - hiddenAt >= minAwayMs) onReturnRef.current?.();
      hiddenAt = null;
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [minAwayMs]);
}
