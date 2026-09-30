// 任務列表：週期性家務事之類，標記完成會自動算下次到期日、保留完成歷史。
// 新增任務是 App.jsx 右下角的浮動 ＋ 按鈕（跟日檢視同一個位置）；「標記完成」的確認列與時間軸共用 TaskCompleteRow。
import React, { useState } from 'react';
import Icon from '@peggy-life/shared/Icon.jsx';
import { THEME } from '../theme.js';
import { INTERVAL_UNIT_LABEL, diffDays, parseDateKey, todayKey } from '../utils.js';
import TaskCompleteRow from './TaskCompleteRow.jsx';

const S = {
  wrap: { display: 'flex', flexDirection: 'column', minHeight: '100%' },
  header: { padding: '14px 20px 10px' },
  title: { fontSize: 16, fontWeight: 700, color: THEME.textDark },
  list: { flex: 1, padding: '4px 20px 96px', display: 'flex', flexDirection: 'column', gap: 10 },
  card: { padding: 14, background: THEME.surfaceAlt2, borderRadius: THEME.radiusSm },
  cardTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  cardMain: { flex: 1, minWidth: 0 },
  taskTitle: { fontSize: 15, fontWeight: 600, color: THEME.textDark },
  meta: { fontSize: 12, color: THEME.textMuted, marginTop: 2 },
  status: (color) => ({ fontSize: 13, fontWeight: 700, color, whiteSpace: 'nowrap' }),
  actionsRow: { display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, flexWrap: 'wrap' },
  completeBtn: { display: 'flex', alignItems: 'center', gap: 5, border: 'none', padding: '8px 12px', borderRadius: 999, background: THEME.primarySoft, color: THEME.primary, fontSize: 13, fontWeight: 700 },
  textBtn: (color) => ({ border: 'none', background: 'none', padding: '8px 10px', fontSize: 13, fontWeight: 600, color }),
  notShown: { fontSize: 12, color: THEME.textFaint, marginTop: 8 },
  history: { marginTop: 10, paddingTop: 10, borderTop: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column', gap: 4 },
  historyItem: { fontSize: 12, color: THEME.textMuted },
  empty: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '60px 0', fontSize: 14, color: THEME.textFaint, textAlign: 'center' },
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
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.title}>任務</div>
      </div>

      <div style={S.list}>
        {sorted.length === 0 ? (
          <div style={S.empty}>
            <div>還沒有任務</div>
            <div style={{ fontSize: 13 }}>換床單、繳費這類定期要做的事，可以設成任務</div>
          </div>
        ) : sorted.map((t) => {
          const diff = diffDays(t.next_due, today);
          let statusLabel; let statusColor;
          if (diff < 0) { statusLabel = `已逾期 ${-diff} 天`; statusColor = THEME.error; }
          else if (diff === 0) { statusLabel = '今天到期'; statusColor = THEME.primary; }
          else { statusLabel = `${diff} 天後到期`; statusColor = THEME.textMuted; }

          const history = [...(t.history || [])].sort((a, b) => b.localeCompare(a));
          const isCompleting = completingId === t.id;
          const isDeleteConfirm = deleteConfirmId === t.id;
          const isExpanded = expandedId === t.id;

          return (
            <div key={t.id} style={S.card}>
              <div style={S.cardTop}>
                <button type="button" className="btn-reset" style={S.cardMain} onClick={() => onEdit(t)}>
                  <div style={S.taskTitle}>{t.title}</div>
                  <div style={S.meta}>
                    每 {t.interval_value}{INTERVAL_UNIT_LABEL[t.interval_unit]}一次 · {t.last_done ? `上次完成 ${fmtMD(t.last_done)}` : '尚未完成過'}
                  </div>
                </button>
                <div style={S.status(statusColor)}>{statusLabel}</div>
              </div>

              {isCompleting ? (
                <TaskCompleteRow
                  onConfirm={async (date) => { await onComplete(t, date); setCompletingId(null); }}
                  onCancel={() => setCompletingId(null)}
                />
              ) : (
                <div style={S.actionsRow}>
                  <button type="button" style={S.completeBtn} onClick={() => setCompletingId(t.id)}>
                    <Icon name="check" size={14} />標記完成
                  </button>
                  {history.length > 0 && (
                    <button type="button" style={S.textBtn(THEME.textMuted)} aria-expanded={isExpanded} onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                      {isExpanded ? '隱藏歷史紀錄' : `歷史紀錄 (${history.length})`}
                    </button>
                  )}
                  <button type="button" style={S.textBtn(isDeleteConfirm ? THEME.error : THEME.textMuted)} onClick={() => handleDeleteClick(t)}>
                    {isDeleteConfirm ? '確定刪除？' : '刪除'}
                  </button>
                </div>
              )}

              {t.show_on_calendar === false && <div style={S.notShown}>不會顯示在行事曆</div>}

              {isExpanded && (
                <div style={S.history}>
                  {history.map((h) => <div key={h} style={S.historyItem}>✓ {fmtMD(h)}</div>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
