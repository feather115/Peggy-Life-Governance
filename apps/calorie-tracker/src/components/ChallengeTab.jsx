// 「挑戰」分頁：減重比賽（多人邀請碼制、podium、排行榜、週進度圖、本週登記、歷史）
import React, { useState, useMemo } from 'react';
import { daysLeft, computeLeaderboard, myRankIn, lastFriday, memberColor, MEMBER_PALETTE } from '../selectors.js';
import { dateLabel } from '../utils.js';
import ChallengeCreateSheet from './ChallengeCreateSheet.jsx';
import WeightChart from './WeightChart.jsx';

const MEDAL_RGBS = ['192,192,192', '255,215,0', '205,127,50']; // 2/1/3
const MEDAL_EMOJIS = ['🥈', '🥇', '🥉'];
const PODIUM_HEIGHTS = ['108px', '155px', '88px'];
const RANK_NAMES = ['2nd', '1st', '3rd'];
const LB_INDICES = [1, 0, 2];

function fmtKgDiff(v) {
  if (v === null || v === undefined) return '尚未登記';
  return `${v > 0 ? '+' : ''}${v.toFixed(1)} kg`;
}
const diffColor = (v) => v === null ? '#9bb0a3' : v < 0 ? '#2E8B5E' : '#D9544F';
const rankColor = (r) => r === 1 ? '#E8A13C' : r === 2 ? '#9bb0a3' : r === 3 ? '#A06B3B' : '#9bb0a3';

export default function ChallengeTab({ app }) {
  const { challenges, userId, joinChallenge, createChallenge, leaveChallenge, updateChallenge, endChallenge, deleteChallenge, submitWeightEntry, removeWeightEntry, setMemberColor } = app;
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showEnded, setShowEnded] = useState(false);

  const active = challenges.filter(c => c.status === 'active');
  const ended = challenges.filter(c => c.status === 'ended');

  // 預設選中第一個進行中的挑戰
  const current = useMemo(() => {
    if (selectedId) return challenges.find(c => c.id === selectedId) || active[0] || ended[0] || null;
    return active[0] || ended[0] || null;
  }, [selectedId, challenges, active, ended]);

  return (
    <div style={{ padding: '6px 18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#234034' }}>🏆 挑戰</div>
        <button onClick={() => setCreateOpen(true)} style={{ border: 'none', background: '#2E8B5E', color: '#fff', fontWeight: 800, fontSize: 13, padding: '8px 14px', borderRadius: 14, cursor: 'pointer' }}>＋ 新增 / 加入</button>
      </div>
      <div style={{ fontSize: 14, color: '#6E8B7C', fontWeight: 700 }}>跟朋友一起減重，看誰先甩肉成功</div>

      {challenges.length === 0 && <EmptyState onOpen={() => setCreateOpen(true)} />}

      {challenges.length > 0 && (
        <>
          {/* 挑戰切換 chip（若有多個進行中） */}
          {active.length > 1 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto', paddingBottom: 4 }}>
              {active.map(c => (
                <button key={c.id} onClick={() => setSelectedId(c.id)}
                  style={{ flexShrink: 0, border: 'none', background: c.id === current?.id ? '#2E8B5E' : '#fff', color: c.id === current?.id ? '#fff' : '#234034', fontWeight: 800, fontSize: 13, padding: '8px 14px', borderRadius: 14, cursor: 'pointer' }}>
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {current && <ChallengeView
            key={current.id}
            challenge={current}
            myUserId={userId}
            onSubmitEntry={submitWeightEntry}
            onRemoveEntry={removeWeightEntry}
            onUpdate={updateChallenge}
            onEnd={endChallenge}
            onDelete={deleteChallenge}
            onLeave={leaveChallenge}
            onSetColor={setMemberColor}
          />}

          {ended.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <button onClick={() => setShowEnded(!showEnded)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#fff', border: 'none', borderRadius: 18, cursor: 'pointer', color: '#234034', boxShadow: '0 10px 24px -18px rgba(46,139,94,.5)' }}>
                <span style={{ fontSize: 16, fontWeight: 900 }}>🗂 歷史挑戰</span>
                <span style={{ fontSize: 13, color: '#6E8B7C' }}>{ended.length} 場 {showEnded ? '▲' : '▼'}</span>
              </button>
              {showEnded && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ended.map(c => (
                    <EndedChallengeCard key={c.id} challenge={c} myUserId={userId} onSelect={() => setSelectedId(c.id)} active={current?.id === c.id} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {createOpen && <ChallengeCreateSheet
        onClose={() => setCreateOpen(false)}
        onCreate={async (payload) => { await createChallenge(payload); setCreateOpen(false); }}
        onJoin={async (code) => { await joinChallenge(code); setCreateOpen(false); }}
      />}
    </div>
  );
}

function EmptyState({ onOpen }) {
  return (
    <div style={{ background: '#fff', borderRadius: 24, padding: '40px 24px', marginTop: 20, textAlign: 'center', boxShadow: '0 10px 24px -18px rgba(46,139,94,.5)' }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>🏆</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: '#234034', marginBottom: 6 }}>加入或建立你的第一個挑戰</div>
      <div style={{ fontSize: 13, color: '#6E8B7C', fontWeight: 600, lineHeight: 1.8, marginBottom: 18 }}>跟朋友互相監督，<br/>看誰先成功減重</div>
      <button onClick={onOpen} style={{ border: 'none', background: '#2E8B5E', color: '#fff', fontWeight: 900, fontSize: 15, padding: '14px 28px', borderRadius: 16, cursor: 'pointer' }}>開始</button>
    </div>
  );
}

function ChallengeView({ challenge, myUserId, onSubmitEntry, onRemoveEntry, onUpdate, onEnd, onDelete, onLeave, onSetColor }) {
  const isCreator = challenge.creatorUserId === myUserId;
  const isActive = challenge.status === 'active';
  const lb = useMemo(() => computeLeaderboard(challenge, myUserId), [challenge, myUserId]);
  const myRank = myRankIn(lb, myUserId);
  const dl = daysLeft(challenge.endDate);
  const dlColor = dl <= 7 ? '#D9544F' : dl <= 14 ? '#E8A13C' : '#2E8B5E';

  return (
    <div>
      {/* Banner */}
      <div style={{ background: '#fff', borderRadius: 24, padding: '20px 22px', marginTop: 14, boxShadow: '0 14px 32px -18px rgba(46,139,94,.4)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              {isActive ? (
                <>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2E8B5E' }} />
                  <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, color: '#2E8B5E' }}>進行中</span>
                </>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, color: '#9bb0a3' }}>已結束</span>
              )}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#234034', lineHeight: 1.2 }}>{challenge.name}</div>
            <div style={{ fontSize: 13, color: '#6E8B7C', fontWeight: 600, marginTop: 4 }}>{dateLabel(challenge.startDate)} → {dateLabel(challenge.endDate)}</div>
          </div>
          {isActive && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, color: dlColor }}>{dl}</div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#9bb0a3' }}>天後結束</div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid #EEF4F0' }}>
          <span style={{ fontSize: 11, color: '#6E8B7C', fontWeight: 700 }}>邀請碼</span>
          <code style={{ fontSize: 16, fontWeight: 900, letterSpacing: 2, color: '#2E8B5E', background: '#EAF5EE', padding: '4px 10px', borderRadius: 8 }}>{challenge.inviteCode}</code>
          <button onClick={() => navigator.clipboard?.writeText(challenge.inviteCode)} style={{ border: 'none', background: '#F0F3F1', color: '#6E8B7C', fontWeight: 700, fontSize: 12, padding: '5px 10px', borderRadius: 8, cursor: 'pointer' }}>複製</button>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9bb0a3', fontWeight: 700 }}>{challenge.members.length} 人</span>
        </div>
      </div>

      {/* 即時排行榜 */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#234034' }}>🥊 即時排行榜</div>
          {myRank && <span style={{ fontSize: 12, color: '#6E8B7C', fontWeight: 700 }}>你是第 {myRank} 名</span>}
        </div>

        {/* Podium */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '16px 12px 0', boxShadow: '0 10px 24px -18px rgba(46,139,94,.5)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6, padding: '0 8px' }}>
            {[0, 1, 2].map(pos => {
              const item = lb[LB_INDICES[pos]];
              const rgb = MEDAL_RGBS[pos];
              const block = { width: '100%', height: PODIUM_HEIGHTS[pos], background: `rgba(${rgb},0.18)`, borderTop: `3px solid rgba(${rgb},0.6)`, borderRadius: '8px 8px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 };
              if (!item || item.kgDiff === null) {
                return (
                  <div key={pos} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 140 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F6FAF7', border: '2px dashed #DCEDE3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bcccc2', fontSize: 18, marginBottom: 6 }}>?</div>
                    <div style={{ fontSize: 11, color: '#bcccc2', fontWeight: 700, paddingBottom: 8 }}>—</div>
                    <div style={block}>
                      <span style={{ fontSize: 28, lineHeight: 1 }}>{MEDAL_EMOJIS[pos]}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: `rgba(${rgb},0.7)`, letterSpacing: 1.5 }}>{RANK_NAMES[pos]}</span>
                    </div>
                  </div>
                );
              }
              return (
                <div key={pos} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 140 }}>
                  <Avatar name={item.name} color={item.color} size={50} border={`3px solid rgba(${rgb},0.85)`} />
                  <div style={{ textAlign: 'center', padding: '6px 0 8px' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#234034', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{item.name}{item.isMe ? ' (你)' : ''}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: diffColor(item.kgDiff), marginTop: 2 }}>
                      {item.kgDiff < 0 ? `▼ ${(-item.kgDiff).toFixed(1)}` : `▲ ${item.kgDiff.toFixed(1)}`} kg
                    </div>
                  </div>
                  <div style={block}>
                    <span style={{ fontSize: 28, lineHeight: 1 }}>{MEDAL_EMOJIS[pos]}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: `rgba(${rgb},0.95)`, letterSpacing: 1.5 }}>{RANK_NAMES[pos]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Full list */}
        <div style={{ background: '#fff', borderRadius: 18, marginTop: 10, boxShadow: '0 10px 24px -18px rgba(46,139,94,.5)', overflow: 'hidden' }}>
          {lb.map(item => (
            <div key={item.userId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: '1px solid #EEF4F0', background: item.isMe ? '#F6FAF7' : 'transparent' }}>
              <div style={{ width: 28, textAlign: 'center', fontSize: 16, fontWeight: 900, color: rankColor(item.rank) }}>
                {item.rank <= 3 ? ['🥇','🥈','🥉'][item.rank-1] : item.rank}
              </div>
              <Avatar name={item.name} color={item.color} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: item.isMe ? '#2E8B5E' : '#234034' }}>{item.name}{item.isMe ? ' (你)' : ''}</div>
                <div style={{ fontSize: 11, color: '#9bb0a3', fontWeight: 600, marginTop: 1 }}>{item.lastUpdated ? `更新 ${dateLabel(item.lastUpdated.slice(0,10))}` : '尚未登記'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: diffColor(item.kgDiff), lineHeight: 1 }}>{fmtKgDiff(item.kgDiff)}</div>
                <div style={{ fontSize: 10, color: '#9bb0a3', fontWeight: 700, marginTop: 2 }}>差值</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 進度圖 */}
      {challenge.entries.length > 0 && <ProgressChartCard challenge={challenge} myUserId={myUserId} onSetColor={onSetColor} />}

      {/* 本週登記 */}
      {isActive && <EntryForm challenge={challenge} myUserId={myUserId} onSubmit={onSubmitEntry} onRemove={onRemoveEntry} />}

      {/* 管理 / 退出 */}
      <div style={{ marginTop: 16, background: '#fff', borderRadius: 18, padding: '16px 18px', boxShadow: '0 10px 24px -18px rgba(46,139,94,.5)' }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#234034', marginBottom: 10 }}>{isCreator ? '建立者選項' : '挑戰選項'}</div>

        {isCreator && isActive && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <EditName challenge={challenge} onUpdate={onUpdate} />
            <EditEndDate challenge={challenge} onUpdate={onUpdate} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: isCreator && isActive ? 12 : 0 }}>
          {isCreator && isActive && (
            <button onClick={async () => {
              if (!confirm('確定結束這個挑戰嗎？冠軍會被自動決定。')) return;
              const winner = lb.find(x => x.kgDiff !== null);
              await onEnd(challenge.id, winner ? winner.userId : null);
            }} style={primaryBtn}>結束挑戰</button>
          )}
          {isCreator && (
            <button onClick={async () => {
              if (!confirm('完全刪除這個挑戰？所有人的記錄都會消失，無法復原。')) return;
              await onDelete(challenge.id);
            }} style={dangerBtn}>刪除挑戰</button>
          )}
          {!isCreator && (
            <button onClick={async () => {
              if (!confirm('退出這個挑戰嗎？你的記錄會被刪除。')) return;
              await onLeave(challenge.id);
            }} style={dangerBtn}>退出挑戰</button>
          )}
        </div>
      </div>
    </div>
  );
}

// 進度圖卡片：人多時點圖例可單獨高亮一條線，其他淡化，避免線太多看不清楚
// 自己的圖例可以點旁邊的調色盤圖示改顏色（存在 challenge_members.color，僅影響自己看到的這個挑戰）
function ProgressChartCard({ challenge, myUserId, onSetColor }) {
  const [highlight, setHighlight] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <div style={{ marginTop: 16, background: '#fff', borderRadius: 20, padding: '18px 14px 14px', boxShadow: '0 10px 24px -18px rgba(46,139,94,.5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#234034' }}>🔥 每週甩肉戰績</div>
        <span style={{ fontSize: 11, color: '#9bb0a3', fontWeight: 700 }}>每週五登記</span>
      </div>
      <WeightChart challenge={challenge} highlightUserId={highlight} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 10px', marginTop: 12, paddingTop: 12, borderTop: '1px solid #EEF4F0' }}>
        {challenge.members.length > 1 && (
          <div style={{ fontSize: 11, color: '#bcccc2', fontWeight: 700, width: '100%' }}>點人名可單獨看那條線</div>
        )}
        {challenge.members.map(m => {
          const dim = highlight && highlight !== m.userId;
          const isMe = m.userId === myUserId;
          return (
            <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button onClick={() => setHighlight(highlight === m.userId ? null : m.userId)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: highlight === m.userId ? '#F0F3F1' : 'transparent', borderRadius: 10, padding: '4px 8px', cursor: 'pointer', opacity: dim ? 0.4 : 1 }}>
                <div style={{ width: 18, height: 3, borderRadius: 2, background: memberColor(challenge, m.userId) }} />
                <span style={{ fontSize: 12, color: '#6E8B7C', fontWeight: 600 }}>{m.name}</span>
              </button>
              {isMe && onSetColor && (
                <button onClick={() => setPickerOpen(!pickerOpen)} title="改顏色"
                  style={{ border: 'none', background: 'transparent', color: '#bcccc2', fontSize: 13, cursor: 'pointer', padding: 2 }}>🎨</button>
              )}
            </div>
          );
        })}
      </div>
      {pickerOpen && (
        <ColorPicker
          current={memberColor(challenge, myUserId)}
          onPick={async (hex) => { await onSetColor(challenge.id, hex); setPickerOpen(false); }}
        />
      )}
    </div>
  );
}

function ColorPicker({ current, onPick }) {
  return (
    <div style={{ marginTop: 10, padding: 12, background: '#F6FAF7', borderRadius: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {MEMBER_PALETTE.map(hex => (
        <button key={hex} onClick={() => onPick(hex)}
          style={{ width: 30, height: 30, borderRadius: '50%', background: hex, border: hex === current ? '3px solid #234034' : '2px solid #fff', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,.15)' }} />
      ))}
    </div>
  );
}

function EntryForm({ challenge, myUserId, onSubmit, onRemove }) {
  const [kg, setKg] = useState('');
  const [date, setDate] = useState(lastFriday());
  const [msg, setMsg] = useState(null); // {kind:'success'|'error', text}
  const [busy, setBusy] = useState(false);
  const [editingWeek, setEditingWeek] = useState(null); // 正在編輯哪一週（用 week_label 辨識，避免改日期變成新增）

  const myEntries = challenge.entries
    .filter(e => e.userId === myUserId)
    .sort((a, b) => b.weekLabel.localeCompare(a.weekLabel));

  const startEdit = (e) => {
    setEditingWeek(e.weekLabel);
    setKg(String(e.kgDiff));
    setDate(e.weekLabel);
    setMsg(null);
  };
  const cancelEdit = () => { setEditingWeek(null); setKg(''); setDate(lastFriday()); setMsg(null); };

  const submit = async () => {
    const n = parseFloat(kg);
    if (isNaN(n)) { setMsg({ kind:'error', text:'請輸入有效數字（例如 -2.5）' }); return; }
    setBusy(true);
    try {
      // 編輯時日期固定用原 week_label，避免改日期變成多新增一筆
      await onSubmit({ challengeId: challenge.id, kgDiff: n, weekLabel: editingWeek || date });
      setMsg({ kind:'success', text:`✓ 已${editingWeek ? '更新' : '記錄'} ${n > 0 ? '+' : ''}${n} kg` });
      setKg('');
      setEditingWeek(null);
      setTimeout(() => setMsg(null), 2500);
    } catch (e) {
      setMsg({ kind:'error', text: e.message || '送出失敗' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 16, background: '#fff', borderRadius: 20, padding: '20px 18px', boxShadow: '0 10px 24px -18px rgba(46,139,94,.5)' }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#234034', marginBottom: 4 }}>📝 本週登記</div>
      <div style={{ fontSize: 12, color: '#6E8B7C', fontWeight: 600, marginBottom: 14, lineHeight: 1.6 }}>從挑戰開始到現在的體重差值（減重用負數，例如 -2.5）</div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 130 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#6E8B7C', letterSpacing: 1, marginBottom: 6 }}>公斤差值</div>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>
            {/* 有些手機鍵盤打不出負號，所以用按鈕切換正負，不用打字也行 */}
            <button type="button" onClick={() => setKg((v) => v.startsWith('-') ? v.slice(1) : v ? `-${v}` : '-')}
              style={{ width: 44, border: 'none', background: '#EAF5EE', color: '#2E8B5E', fontWeight: 900, fontSize: 20, borderRadius: 12, cursor: 'pointer', flexShrink: 0 }}>±</button>
            <input type="text" inputMode="decimal" value={kg} onChange={(e) => { if (/^-?\d*\.?\d*$/.test(e.target.value)) setKg(e.target.value); }} placeholder="-2.5"
              style={{ flex: 1, minWidth: 0, border: 'none', background: '#F6FAF7', borderRadius: 14, padding: '14px 8px', fontSize: 22, fontWeight: 900, color: '#234034', textAlign: 'center' }} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 130 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#6E8B7C', letterSpacing: 1, marginBottom: 6 }}>日期（週五）</div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={!!editingWeek}
            style={{ width: '100%', border: 'none', background: editingWeek ? '#EEF4F0' : '#F6FAF7', borderRadius: 14, padding: '14px 15px', fontSize: 16, fontWeight: 700, color: editingWeek ? '#9bb0a3' : '#234034' }} />
        </div>
      </div>

      {msg && <div style={{ padding: '10px 14px', borderRadius: 12, marginBottom: 12, fontSize: 13, fontWeight: 700, color: msg.kind === 'success' ? '#15803D' : '#B91C1C', background: msg.kind === 'success' ? '#DCFCE7' : '#FEE2E2' }}>{msg.text}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={submit} disabled={busy} style={{ flex: 1, border: 'none', background: busy ? '#C7D6CC' : '#2E8B5E', color: '#fff', fontWeight: 900, fontSize: 15, padding: 14, borderRadius: 14, cursor: 'pointer' }}>{busy ? '送出中…' : editingWeek ? '更新記錄' : '送出記錄'}</button>
        {editingWeek && <button onClick={cancelEdit} style={{ border: 'none', background: '#F0F3F1', color: '#6E8B7C', fontWeight: 800, fontSize: 14, padding: '14px 18px', borderRadius: 14, cursor: 'pointer' }}>取消</button>}
      </div>

      {myEntries.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #EEF4F0' }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, color: '#9bb0a3', marginBottom: 10 }}>我的登記紀錄（{myEntries.length} 筆）</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
            {myEntries.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '9px 12px', background: editingWeek === e.weekLabel ? '#EAF5EE' : '#F6FAF7', borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: '#6E8B7C', fontWeight: 600 }}>{e.weekLabel}</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: diffColor(e.kgDiff) }}>{fmtKgDiff(e.kgDiff)}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => startEdit(e)} style={{ border: 'none', background: '#fff', color: '#6E8B7C', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', fontSize: 13 }}>✏</button>
                  <button onClick={async () => { if (confirm('刪除這筆紀錄？')) { if (editingWeek === e.weekLabel) cancelEdit(); await onRemove(e.id); } }} style={{ border: 'none', background: '#fff', color: '#bcccc2', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EndedChallengeCard({ challenge, myUserId, onSelect, active }) {
  const lb = computeLeaderboard(challenge, myUserId);
  const winner = lb[0];
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 10px 24px -18px rgba(46,139,94,.5)', border: active ? '2px solid #2E8B5E' : '2px solid transparent', cursor: 'pointer' }} onClick={onSelect}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#234034' }}>{challenge.name}</div>
          <div style={{ fontSize: 12, color: '#9bb0a3', marginTop: 2 }}>{dateLabel(challenge.startDate)} → {dateLabel(challenge.endDate)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#9bb0a3', fontWeight: 700, letterSpacing: 1 }}>冠軍</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#E8A13C' }}>🏆 {winner?.name || '—'}</div>
        </div>
      </div>
    </div>
  );
}

// 建立者用：點「編輯」展開輸入欄位修改挑戰名稱
function EditName({ challenge, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(challenge.name);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setErr('名稱不能空白'); return; }
    if (trimmed === challenge.name) { setEditing(false); return; }
    setBusy(true); setErr('');
    try {
      await onUpdate(challenge.id, { name: trimmed });
      setEditing(false);
    } catch (e) {
      setErr(e.message || '更新失敗');
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <button onClick={() => { setName(challenge.name); setEditing(true); setErr(''); }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10, padding: '10px 14px', background: '#F6FAF7', border: 'none', borderRadius: 12, cursor: 'pointer' }}>
        <span style={{ fontSize: 13, color: '#6E8B7C', fontWeight: 700 }}>✏ 挑戰名稱</span>
        <span style={{ fontSize: 14, color: '#234034', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{challenge.name} ›</span>
      </button>
    );
  }
  return (
    <div style={{ background: '#F6FAF7', borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: '#6E8B7C', letterSpacing: 1, marginBottom: 6 }}>新的挑戰名稱</div>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus
        style={{ width: '100%', border: 'none', background: '#fff', borderRadius: 10, padding: '12px 14px', fontSize: 16, fontWeight: 700, color: '#234034' }} />
      {err && <div style={{ marginTop: 8, fontSize: 12, color: '#B91C1C', fontWeight: 700 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={save} disabled={busy} style={{ ...primaryBtn, flex: 1, opacity: busy ? 0.6 : 1 }}>{busy ? '儲存中…' : '儲存'}</button>
        <button onClick={() => setEditing(false)} style={{ ...dangerBtn, background: '#fff', color: '#6E8B7C', flex: 1 }}>取消</button>
      </div>
    </div>
  );
}

// 建立者用：點「編輯」展開日期欄位修改結束日期
function EditEndDate({ challenge, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(challenge.endDate);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (new Date(date) <= new Date(challenge.startDate)) {
      setErr('結束日期要在開始之後');
      return;
    }
    setBusy(true); setErr('');
    try {
      await onUpdate(challenge.id, { endDate: date });
      setEditing(false);
    } catch (e) {
      setErr(e.message || '更新失敗');
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <button onClick={() => { setDate(challenge.endDate); setEditing(true); setErr(''); }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10, padding: '10px 14px', background: '#F6FAF7', border: 'none', borderRadius: 12, cursor: 'pointer' }}>
        <span style={{ fontSize: 13, color: '#6E8B7C', fontWeight: 700 }}>📅 結束日期</span>
        <span style={{ fontSize: 14, color: '#234034', fontWeight: 800 }}>{challenge.endDate} ›</span>
      </button>
    );
  }
  return (
    <div style={{ background: '#F6FAF7', borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: '#6E8B7C', letterSpacing: 1, marginBottom: 6 }}>新的結束日期</div>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
        style={{ width: '100%', border: 'none', background: '#fff', borderRadius: 10, padding: '12px 14px', fontSize: 16, fontWeight: 700, color: '#234034' }} />
      {err && <div style={{ marginTop: 8, fontSize: 12, color: '#B91C1C', fontWeight: 700 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={save} disabled={busy} style={{ ...primaryBtn, flex: 1, opacity: busy ? 0.6 : 1 }}>{busy ? '儲存中…' : '儲存'}</button>
        <button onClick={() => setEditing(false)} style={{ ...dangerBtn, background: '#fff', color: '#6E8B7C', flex: 1 }}>取消</button>
      </div>
    </div>
  );
}

function Avatar({ name, color, size = 32, border = 'none' }) {
  // 名稱是 @xxx 形式（從 email 來的後備名稱）時，跳過 @ 取下一個字當頭像
  const raw = name || '?';
  const initial = (raw.startsWith('@') ? raw.slice(1, 2) : raw.slice(0, 1)) || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color || '#9bb0a3',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.42), fontWeight: 800, color: '#fff', flexShrink: 0, border,
    }}>{initial}</div>
  );
}

const primaryBtn = { border: 'none', background: '#2E8B5E', color: '#fff', fontWeight: 800, fontSize: 13, padding: '10px 18px', borderRadius: 12, cursor: 'pointer' };
const dangerBtn = { border: 'none', background: '#FEE2E2', color: '#D9544F', fontWeight: 800, fontSize: 13, padding: '10px 18px', borderRadius: 12, cursor: 'pointer' };
