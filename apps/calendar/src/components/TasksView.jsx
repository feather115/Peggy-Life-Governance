// 任務列表：週期性家務事之類，標記完成會自動算下次到期日、保留完成歷史。
import React, { useState } from 'react';
import { THEME } from '../theme.js';
import { INTERVAL_UNIT_LABEL, diffDays, parseDateKey, todayKey } from '../utils.js';

const S = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 10px' },
  title: { fontSize: 16, fontWeight: 700, color: THEME.textDark },
  addBtn: { border: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: THEME.radiusSm, background: THEME.primary, color: '#fff', fontSize: 13, fontWeight: 700, outline: 'none' },
  list: { flex: 1, padding: '4px 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  card: { padding: 14, background: THEME.surfaceAlt2, borderRadius: THEME.radiusSm },
  cardTop: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  cardMain: { flex: 1, cursor: 'pointer' },
  taskTitle: { fontSize: 15, fontWeight: 600, color: THEME.textDark },
  meta: { fontSize: 12, color: THEME.textMuted, marginTop: 2 },
  status: (color) => ({ fontSize: 13, fontWeight: 700, color, whiteSpace: 'nowrap' }),
  actionsRow: { display: 'flex', gap: 18, marginTop: 10 },
  actionLink: (color) => ({ fontSize: 13, fontWeight: 600, color, cursor: 'pointer' }),
  notShown: { fontSize: 11, color: THEME.textFaint, marginTop: 8 },
  completeRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 },
  dateInput: { flex: 1, boxSizing: 'border-box', padding: '9px 10px', borderRadius: THEME.radiusSmInner, border: `1px solid ${THEME.border}`, fontSize: 14, color: THEME.textDark, background: THEME.surface },
  confirmBtn: { border: 'none', cursor: 'pointer', padding: '9px 12px', borderRadius: THEME.radiusSmInner, background: THEME.primary, color: '#fff', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' },
  cancelBtn: { border: 'none', background: 'none', cursor: 'pointer', padding: '9px 4px', fontSize: 13, color: THEME.textMuted },
  history: { marginTop: 10, paddingTop: 10, borderTop: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column', gap: 4 },
  historyItem: { fontSize: 12, color: THEME.textMuted },
  empty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', fontSize: 14, color: THEME.textFaint },
};

function fmtMD(dateKey) {
  const d = parseDateKey(dateKey);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function TasksView({ tasks, onEdit, onCreate, onDelete, onConfirmComplete }) {
  const [completingId, setCompletingId] = useState(null);
  const [completeDraft, setCompleteDraft] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const today = todayKey();
  const sorted = [...tasks].sort((a, b) => a.next_due.localeCompare(b.next_due));

  const startComplete = (t) => { setCompletingId(t.id); setCompleteDraft(today); };
  const confirmComplete = async (t) => {
    await onConfirmComplete(t.id, completeDraft);
    setCompletingId(null);
  };

  const handleDeleteClick = (t) => {
    if (deleteConfirmId !== t.id) { setDeleteConfirmId(t.id); return; }
    onDelete(t.id);
    setDeleteConfirmId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={S.header}>
        <div style={S.title}>任務</div>
        <button type="button" style={S.addBtn} onClick={onCreate}>＋ 新增任務</button>
      </div>

      <div style={S.list}>
        {sorted.length === 0 ? (
          <div style={S.empty}>還沒有任務</div>
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
                <div style={S.cardMain} onClick={() => onEdit(t)}>
                  <div style={S.taskTitle}>{t.title}</div>
                  <div style={S.meta}>
                    每 {t.interval_value}{INTERVAL_UNIT_LABEL[t.interval_unit]}一次 · {t.last_done ? `上次完成 ${fmtMD(t.last_done)}` : '尚未完成過'}
                  </div>
                </div>
                <div style={S.status(statusColor)}>{statusLabel}</div>
              </div>

              {isCompleting ? (
                <div style={S.completeRow}>
                  <input type="date" style={S.dateInput} value={completeDraft} onChange={(e) => setCompleteDraft(e.target.value)} />
                  <button type="button" style={S.confirmBtn} onClick={() => confirmComplete(t)}>確認完成</button>
                  <button type="button" style={S.cancelBtn} onClick={() => setCompletingId(null)}>取消</button>
                </div>
              ) : (
                <div style={S.actionsRow}>
                  <span style={S.actionLink(THEME.primary)} onClick={() => startComplete(t)}>標記完成</span>
                  {history.length > 0 && (
                    <span style={S.actionLink(THEME.textMuted)} onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                      {isExpanded ? '隱藏歷史紀錄' : `歷史紀錄 (${history.length})`}
                    </span>
                  )}
                  <span style={S.actionLink(isDeleteConfirm ? THEME.error : THEME.textMuted)} onClick={() => handleDeleteClick(t)}>
                    {isDeleteConfirm ? '確定刪除？' : '刪除'}
                  </span>
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
