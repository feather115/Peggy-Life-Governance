// 任務列表：週期性家務事之類，標記完成會自動算下次到期日、保留完成歷史。
// 標題「任務」在 App.jsx 的頁首；新增任務是右下角的浮動 ＋ 按鈕（跟日檢視同一個位置）；「標記完成」的確認列與時間軸共用 TaskCompleteRow。
import React, { useState } from 'react';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';
import { THEME } from '../theme.js';
import { INTERVAL_UNIT_LABEL, diffDays, parseDateKey, todayKey } from '../utils.js';
import TaskCompleteRow from './TaskCompleteRow.jsx';

const S = {
  // 底部留空間給浮動 ＋ 按鈕
  list: { padding: '8px 20px 100px', display: 'flex', flexDirection: 'column', gap: 10 },
  card: { ...UI.card, padding: 16 },
  cardTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  cardMain: { flex: 1, minWidth: 0, padding: 0, border: 'none', background: 'none', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 },
  taskTitle: { fontSize: 15, fontWeight: 500, color: THEME.textDark },
  meta: { fontSize: 13, color: THEME.textMuted },
  actionsRow: { display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, flexWrap: 'wrap' },
  textBtn: (color) => ({ ...UI.btnText, minHeight: 36, color }),
  notShown: { fontSize: 13, color: THEME.textFaint, marginTop: 8 },
  history: { marginTop: 12, paddingTop: 12, borderTop: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column', gap: 4 },
  historyItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: THEME.textMuted, ...UI.num },
  empty: { ...UI.card, padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' },
  emptyIcon: { width: 48, height: 48, borderRadius: 999, background: 'var(--sunken)', color: THEME.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

function fmtMD(dateKey) {
  const d = parseDateKey(dateKey);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function TasksView({ tasks, onEdit, onDelete, onComplete }) {
  const [completingId, setCompletingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const today = todayKey();
  const sorted = [...tasks].sort((a, b) => a.next_due.localeCompare(b.next_due));

  const handleDeleteClick = (t) => {
    if (deleteConfirmId !== t.id) { setDeleteConfirmId(t.id); return; }
    onDelete(t.id);
    setDeleteConfirmId(null);
  };

  return (
    <div style={S.list}>
      {sorted.length === 0 ? (
        <div style={S.empty}>
          <span aria-hidden="true" style={S.emptyIcon}><Icon name="check-square" size={22} /></span>
          <div style={{ fontSize: 15, fontWeight: 500, color: THEME.textDark }}>還沒有任務</div>
          <div style={{ fontSize: 13, color: THEME.textMuted }}>換床單、繳費這類定期要做的事，可以設成任務</div>
        </div>
      ) : sorted.map((t) => {
        const diff = diffDays(t.next_due, today);
        let statusLabel; let statusTone;
        if (diff < 0) { statusLabel = `已逾期 ${-diff} 天`; statusTone = 'danger'; }
        else if (diff === 0) { statusLabel = '今天到期'; statusTone = 'primary'; }
        else { statusLabel = `${diff} 天後到期`; statusTone = 'neutral'; }

        const history = [...(t.history || [])].sort((a, b) => b.localeCompare(a));
        const isCompleting = completingId === t.id;
        const isDeleteConfirm = deleteConfirmId === t.id;
        const isExpanded = expandedId === t.id;

        return (
          <div key={t.id} style={S.card}>
            <div style={S.cardTop}>
              <button type="button" style={S.cardMain} onClick={() => onEdit(t)}>
                <span style={S.taskTitle}>{t.title}</span>
                <span style={S.meta}>
                  每 {t.interval_value}{INTERVAL_UNIT_LABEL[t.interval_unit]}一次 · {t.last_done ? `上次完成 ${fmtMD(t.last_done)}` : '尚未完成過'}
                </span>
              </button>
              <span style={UI.tag(statusTone)}>{statusLabel}</span>
            </div>

            {isCompleting ? (
              <TaskCompleteRow
                onConfirm={async (date) => { await onComplete(t, date); setCompletingId(null); }}
                onCancel={() => setCompletingId(null)}
              />
            ) : (
              <div style={S.actionsRow}>
                <button type="button" style={{ ...UI.btnSecondary, minHeight: 36 }} onClick={() => setCompletingId(t.id)}>
                  <Icon name="check" size={16} strokeWidth={2} />標記完成
                </button>
                {history.length > 0 && (
                  <button type="button" style={S.textBtn(THEME.textMuted)} aria-expanded={isExpanded} onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                    {isExpanded ? '隱藏歷史紀錄' : `歷史紀錄 (${history.length})`}
                  </button>
                )}
                <button type="button" style={S.textBtn(isDeleteConfirm ? THEME.errorInk : THEME.textMuted)} onClick={() => handleDeleteClick(t)}>
                  {isDeleteConfirm ? '確定刪除？' : '刪除'}
                </button>
              </div>
            )}

            {t.show_on_calendar === false && <div style={S.notShown}>不會顯示在行事曆</div>}

            {isExpanded && (
              <div style={S.history}>
                {history.map((h) => <div key={h} style={S.historyItem}><Icon name="check" size={14} />{fmtMD(h)}</div>)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
