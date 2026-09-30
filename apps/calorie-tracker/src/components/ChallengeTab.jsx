// "Challenge" tab: weight loss competition (multiplayer invitation code, podium, leaderboard, weekly progress chart, weekly check-in, history)
import React, { useState, useMemo } from 'react';
import { daysLeft, computeLeaderboard, myRankIn, lastFriday, memberColor, MEMBER_PALETTE } from '../selectors.js';
import { dateLabel, alertError, readableOn } from '../utils.js';
import ChallengeCreateSheet from './ChallengeCreateSheet.jsx';
import WeightChart from './WeightChart.jsx';
import Icon from '@peggy-life/shared/Icon.jsx';
import { UI } from '@peggy-life/shared/ui';
import { confirmDialog } from '@peggy-life/shared/feedback.jsx';

const MEDAL_RGBS = ['192,192,192', '255,215,0', '205,127,50']; // 2/1/3
const PODIUM_HEIGHTS = ['96px', '136px', '76px'];
const PODIUM_RANKS = [2, 1, 3];
const LB_INDICES = [1, 0, 2];

function fmtKgDiff(v) {
  if (v === null || v === undefined) return '尚未登記';
  return `${v > 0 ? '+' : ''}${v.toFixed(1)} kg`;
}
function fmtWeight(v) {
  if (v === null || v === undefined) return '—';
  return `${v.toFixed(1)} kg`;
}
const diffColor = (v) => v === null ? 'var(--text-faint)' : v < 0 ? 'var(--primary-ink)' : 'var(--danger-ink)';
const rankColor = (r) => r === 1 ? 'var(--warning-ink)' : r === 2 ? 'var(--text-muted)' : r === 3 ? 'var(--bronze-ink)' : 'var(--text-faint)';

const getWeeklyChangeText = (change) => {
  if (change === null || change === undefined) return '累積差值';
  if (change < 0) return `比上週 -${(-change).toFixed(1)} kg`;
  if (change > 0) return `比上週 +${change.toFixed(1)} kg`;
  return '比上週持平';
};

const getWeeklyChangeColor = (change) => {
  if (change === null || change === undefined) return 'var(--text-faint)';
  if (change < 0) return 'var(--primary-ink)';
  if (change > 0) return 'var(--danger-ink)';
  return 'var(--text-faint)';
};

const S = {
  page: { paddingBottom: 24 },
  card: { ...UI.card, margin: '12px 20px 0', padding: 16 },
  cardHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  meta: { fontSize: 13, color: 'var(--text-muted)' },
  hint: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 },
  chips: { display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 20px 0' },
  back: { ...UI.btnText, margin: '8px 16px 0' },
  daysBox: { background: 'var(--sunken)', borderRadius: 10, padding: '8px 12px', minWidth: 72, textAlign: 'center', flexShrink: 0 },
  daysNum: (color) => ({ fontSize: 24, fontWeight: 600, lineHeight: 1, color, ...UI.num }),
  code: { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 15, fontWeight: 600, letterSpacing: 2, color: 'var(--text)', background: 'var(--sunken)', padding: '4px 10px', borderRadius: 4 },
  podiumWrap: { ...UI.card, padding: '16px 12px 0', overflow: 'hidden' },
  podium: { display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6, padding: '0 8px' },
  podiumCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 140 },
  block: (pos) => ({ width: '100%', height: PODIUM_HEIGHTS[pos], background: `rgba(${MEDAL_RGBS[pos]},0.16)`, borderTop: `3px solid rgba(${MEDAL_RGBS[pos]},0.7)`, borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }),
  blockRank: { fontSize: 24, fontWeight: 600, color: 'var(--text-muted)', ...UI.num },
  lbRow: (isMe) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: isMe ? 'var(--primary-soft)' : 'transparent' }),
  rankNo: (r) => ({ width: 24, textAlign: 'center', fontSize: 16, fontWeight: 600, color: rankColor(r), ...UI.num }),
  entryMsg: (kind) => ({ ...UI.note(kind === 'success' ? 'success' : 'danger'), marginBottom: 12 }),
  fields: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  field: { flex: 1, minWidth: 130 },
  assist: { marginBottom: 12, background: 'var(--sunken)', borderRadius: 10, padding: '10px 12px' },
  smallBtn: { width: 32, height: 32, padding: 0, border: 'none', borderRadius: 999, background: 'var(--surface)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  editBox: { background: 'var(--sunken)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  softDanger: { ...UI.btnNeutral, background: 'var(--danger-bg)', color: 'var(--danger-ink)' },
};

export default function ChallengeTab({ app }) {
  const { challenges, userId, joinChallenge, createChallenge, repeatChallenge, leaveChallenge, updateChallenge, endChallenge, deleteChallenge, submitWeightEntry, removeWeightEntry, setMemberColor, setMemberWeights } = app;
  const [createOpen, setCreateOpen] = useState(false);
  const [repeatSource, setRepeatSource] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showEnded, setShowEnded] = useState(false);

  // 已結束挑戰只有在歷史區展開後，才允許成為目前顯示的挑戰
  const { active, ended, current } = useMemo(() => {
    const act = challenges.filter(c => c.status === 'active');
    const end = challenges.filter(c => c.status === 'ended');
    const selected = selectedId && challenges.find(c => c.id === selectedId);
    const selectedVisible = selected?.status === 'active' || (showEnded && selected?.status === 'ended');
    const cur = (selectedVisible && selected) || act[0] || null;
    return { active: act, ended: end, current: cur };
  }, [selectedId, challenges, showEnded]);

  return (
    <div style={S.page}>
      <header style={UI.header}>
        <div style={{ minWidth: 0 }}>
          <h1 style={UI.title}>挑戰</h1>
          <p style={UI.subtitle}>跟朋友一起減重，互相監督</p>
        </div>
        {challenges.length > 0 && (
          <button type="button" onClick={() => { setRepeatSource(null); setCreateOpen(true); }} style={UI.btnSecondary}><Icon name="plus" size={16} />新增 / 加入</button>
        )}
      </header>

      {challenges.length === 0 && <EmptyState onOpen={() => setCreateOpen(true)} />}

      {challenges.length > 0 && (
        <>
          {/* 挑戰切換 chip（若有多個進行中） */}
          {active.length > 1 && (
            <div className="ps" style={S.chips}>
              {active.map(c => (
                <button key={c.id} type="button" aria-pressed={c.id === current?.id} onClick={() => setSelectedId(c.id)} style={UI.chip(c.id === current?.id)}>
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {current?.status === 'ended' && (
            <button type="button" onClick={() => setSelectedId(null)} style={S.back}><Icon name="chevron-left" size={16} />回到挑戰</button>
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
            onRepeat={() => { setRepeatSource(current); setCreateOpen(true); }}
            onSetColor={setMemberColor}
            onSetWeights={setMemberWeights}
          />}

          {ended.length > 0 && (
            <section style={UI.section}>
              <button type="button" aria-expanded={showEnded} onClick={() => setShowEnded(!showEnded)} style={{ ...UI.row, ...UI.card }}>
                <Icon name="clock" size={20} style={{ color: 'var(--text-muted)' }} />
                <span style={{ ...UI.rowTitle, flex: 1 }}>歷史挑戰</span>
                <span style={S.meta}>{ended.length} 場</span>
                <Icon name="chevron-right" size={18} style={{ color: 'var(--text-faint)', transform: showEnded ? 'rotate(90deg)' : 'none' }} />
              </button>
              {showEnded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ended.map(c => (
                    <EndedChallengeCard key={c.id} challenge={c} myUserId={userId} onSelect={() => setSelectedId(c.id)} active={current?.id === c.id} />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {createOpen && <ChallengeCreateSheet
        onClose={() => { setCreateOpen(false); setRepeatSource(null); }}
        onCreate={async (payload) => {
          const newId = repeatSource
            ? await repeatChallenge(repeatSource.id, payload)
            : await createChallenge(payload);
          if (newId) setSelectedId(newId);
          setCreateOpen(false);
          setRepeatSource(null);
        }}
        onJoin={async (code) => { await joinChallenge(code); setCreateOpen(false); }}
        repeatSource={repeatSource}
      />}
    </div>
  );
}

function EmptyState({ onOpen }) {
  return (
    <div style={{ ...S.card, marginTop: 8, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
      <span aria-hidden="true" style={{ width: 48, height: 48, borderRadius: 999, background: 'var(--sunken)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="trophy" size={22} /></span>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>加入或建立你的第一個挑戰</div>
      <div style={S.hint}>跟朋友互相監督，看誰先成功減重</div>
      <button type="button" onClick={onOpen} style={{ ...UI.btnPrimary, marginTop: 6 }}>開始</button>
    </div>
  );
}

function ChallengeView({ challenge, myUserId, onSubmitEntry, onRemoveEntry, onUpdate, onEnd, onDelete, onLeave, onRepeat, onSetColor, onSetWeights }) {
  const isCreator = challenge.creatorUserId === myUserId;
  const isActive = challenge.status === 'active';
  const lb = useMemo(() => computeLeaderboard(challenge, myUserId), [challenge, myUserId]);
  const myRank = myRankIn(lb, myUserId);
  const dl = daysLeft(challenge.endDate);
  const dlColor = dl <= 7 ? 'var(--danger-ink)' : dl <= 14 ? 'var(--warning-ink)' : 'var(--primary-ink)';

  return (
    <div>
      {/* Banner */}
      <section style={{ ...S.card, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <span style={UI.tag(isActive ? 'primary' : 'neutral')}>{isActive ? '進行中' : '已結束'}</span>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{challenge.name}</h2>
            <div style={S.meta}>{dateLabel(challenge.startDate)} → {dateLabel(challenge.endDate)}</div>
          </div>
          {isActive && (
            <div style={S.daysBox}>
              <div style={S.daysNum(dlColor)}>{dl}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>天後結束</div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
          <span style={S.meta}>邀請碼</span>
          <code style={S.code}>{challenge.inviteCode}</code>
          <button type="button" onClick={() => navigator.clipboard?.writeText(challenge.inviteCode)} style={{ ...UI.btnText, minHeight: 32 }}><Icon name="copy" size={16} />複製</button>
          <span style={{ ...S.meta, marginLeft: 'auto' }}>{challenge.members.length} 人</span>
        </div>
      </section>

      {/* 即時排行榜 */}
      <section style={UI.section}>
        <div style={UI.sectionHead}>
          <h2 style={UI.sectionTitle}>即時排行榜</h2>
          {myRank && <span style={S.meta}>你是第 {myRank} 名</span>}
        </div>

        {/* Podium */}
        <div style={S.podiumWrap}>
          <div style={S.podium}>
            {[0, 1, 2].map(pos => {
              const item = lb[LB_INDICES[pos]];
              if (!item || item.kgDiff === null) {
                return (
                  <div key={pos} style={S.podiumCol}>
                    <div style={{ width: 48, height: 48, borderRadius: 999, background: 'var(--sunken)', border: '2px dashed var(--line-strong)', marginBottom: 6 }} />
                    <div style={{ fontSize: 12, color: 'var(--text-faint)', paddingBottom: 8 }}>—</div>
                    <div style={S.block(pos)}><span style={S.blockRank}>{PODIUM_RANKS[pos]}</span></div>
                  </div>
                );
              }
              return (
                <div key={pos} style={S.podiumCol}>
                  <Avatar name={item.name} color={item.color} size={48} border={`3px solid rgba(${MEDAL_RGBS[pos]},0.85)`} />
                  <div style={{ textAlign: 'center', padding: '6px 0 8px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{item.name}{item.isMe ? '（你）' : ''}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: diffColor(item.kgDiff), marginTop: 2, ...UI.num }}>
                      {item.kgDiff < 0 ? `減 ${(-item.kgDiff).toFixed(1)}` : `增 ${item.kgDiff.toFixed(1)}`} kg
                    </div>
                    {item.weeklyChange !== null && (
                      <div style={{ fontSize: 12, color: getWeeklyChangeColor(item.weeklyChange), marginTop: 1, ...UI.num }}>
                        {item.weeklyChange < 0 ? `比上週 -${(-item.weeklyChange).toFixed(1)}` : `比上週 +${item.weeklyChange.toFixed(1)}`}
                      </div>
                    )}
                  </div>
                  <div style={S.block(pos)}><span style={S.blockRank}>{PODIUM_RANKS[pos]}</span></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Full list */}
        <div style={UI.listCard}>
          {lb.map((item, i) => (
            <div key={item.userId} style={{ ...S.lbRow(item.isMe), borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
              <div style={S.rankNo(item.rank)}>{item.rank}</div>
              <Avatar name={item.name} color={item.color} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...UI.rowTitle, color: item.isMe ? 'var(--primary-ink)' : 'var(--text)' }}>{item.name}{item.isMe ? '（你）' : ''}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{item.lastUpdated ? `更新 ${dateLabel(item.lastUpdated.slice(0,10))}` : '尚未登記'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: diffColor(item.kgDiff), lineHeight: 1.2, ...UI.num }}>{fmtKgDiff(item.kgDiff)}</div>
                <div style={{ fontSize: 12, color: getWeeklyChangeColor(item.weeklyChange), marginTop: 2 }}>
                  {getWeeklyChangeText(item.weeklyChange)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 進度圖 */}
      {challenge.entries.length > 0 && <ProgressChartCard challenge={challenge} myUserId={myUserId} onSetColor={onSetColor} />}

      {/* 本週登記 */}
      {isActive && <EntryForm challenge={challenge} myUserId={myUserId} onSubmit={onSubmitEntry} onRemove={onRemoveEntry} onSetWeights={onSetWeights} />}

      {/* 管理 / 退出 */}
      <section style={S.card}>
        <h2 style={{ ...UI.sectionTitle, marginBottom: 12 }}>{isCreator ? '建立者選項' : '挑戰選項'}</h2>

        {isCreator && isActive && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <EditName challenge={challenge} onUpdate={onUpdate} />
            <EditEndDate challenge={challenge} onUpdate={onUpdate} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: isCreator && isActive ? 12 : 0 }}>
          {isCreator && !isActive && (
            <button type="button" onClick={onRepeat} style={UI.btnSecondary}>原班人馬再來一局</button>
          )}
          {isCreator && isActive && (
            <button type="button" onClick={async () => {
              if (!(await confirmDialog({ title: '結束這個挑戰？', message: '冠軍會依目前成績自動決定。', confirmText: '結束挑戰' }))) return;
              const winner = lb.find(x => x.kgDiff !== null);
              await onEnd(challenge.id, winner ? winner.userId : null).catch((e) => alertError('結束挑戰', e));
            }} style={UI.btnNeutral}>結束挑戰</button>
          )}
          {isCreator && (
            <button type="button" onClick={async () => {
              if (!(await confirmDialog({ title: '完全刪除這個挑戰？', message: '所有人的記錄都會消失，無法復原。', confirmText: '刪除', danger: true }))) return;
              await onDelete(challenge.id).catch((e) => alertError('刪除挑戰', e));
            }} style={S.softDanger}>刪除挑戰</button>
          )}
          {!isCreator && (
            <button type="button" onClick={async () => {
              if (!(await confirmDialog({ title: '退出這個挑戰？', message: '你在這個挑戰的記錄會被刪除。', confirmText: '退出', danger: true }))) return;
              await onLeave(challenge.id).catch((e) => alertError('退出挑戰', e));
            }} style={S.softDanger}>退出挑戰</button>
          )}
        </div>
      </section>
    </div>
  );
}

// Progress chart card: clicking a legend item highlights that line and dims others, preventing clutter when there are many lines
// You can click the palette icon next to your own legend to change color (saved to challenge_members.color, only affects your view of this challenge)
function ProgressChartCard({ challenge, myUserId, onSetColor }) {
  const [highlight, setHighlight] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
  return (
    <section style={{ ...S.card, marginTop: 28 }}>
      <div style={S.cardHead}>
        <h2 style={UI.sectionTitle}>每週甩肉戰績</h2>
        <span style={S.meta}>每週五登記</span>
      </div>
      <WeightChart challenge={challenge} highlightUserId={highlight} selectedWeek={selectedWeek} onSelectWeek={setSelectedWeek} />

      {selectedWeek && (
        <div style={{ marginTop: 14, padding: '12px 12px 8px', background: 'var(--sunken)', borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{dateLabel(selectedWeek)} 戰績清單</span>
            <button type="button" aria-label="關閉戰績清單" className="tap" onClick={() => setSelectedWeek(null)} style={{ ...S.smallBtn, width: 28, height: 28, background: 'none' }}><Icon name="x" size={16} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(() => {
              const list = challenge.members.map(m => {
                const entry = challenge.entries.find(e => e.userId === m.userId && e.weekLabel === selectedWeek);
                const kgVal = entry ? Number(entry.kgDiff) : null;
                return { member: m, kgVal };
              });

              list.sort((a, b) => {
                if (a.kgVal === null && b.kgVal === null) return 0;
                if (a.kgVal === null) return 1;
                if (b.kgVal === null) return -1;
                return a.kgVal - b.kgVal; // Ascending: more negative (most lost) at the top
              });

              return list.map(({ member: m, kgVal }) => {
                // Calculate weekly change compared to the previous registered entry
                const userEntries = challenge.entries
                  .filter(e => e.userId === m.userId)
                  .sort((a, b) => b.weekLabel.localeCompare(a.weekLabel));
                const curIdx = userEntries.findIndex(e => e.weekLabel === selectedWeek);
                const prevEntry = curIdx !== -1 ? userEntries[curIdx + 1] : null;
                const prevKgVal = prevEntry ? Number(prevEntry.kgDiff) : null;
                const chg = (kgVal !== null && prevKgVal !== null) ? (kgVal - prevKgVal) : null;

                return (
                  <div key={m.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--surface)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={m.name} color={memberColor(challenge, m.userId)} size={24} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{m.name}</span>
                    </div>
                    <div style={{ textAlign: 'right', ...UI.num }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: diffColor(kgVal), marginRight: 6 }}>
                        {fmtKgDiff(kgVal)}
                      </span>
                      {chg !== null && (
                        <span style={{ fontSize: 12, color: getWeeklyChangeColor(chg) }}>
                          ({chg < 0 ? `-${(-chg).toFixed(1)}` : `+${chg.toFixed(1)}`})
                        </span>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 10px', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', width: '100%', marginBottom: 4 }}>點圖表可看該週戰績 · 點人名只看那一條線</div>
        {challenge.members.map(m => {
          const dim = highlight && highlight !== m.userId;
          const isMe = m.userId === myUserId;
          return (
            <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button type="button" aria-pressed={highlight === m.userId} onClick={() => setHighlight(highlight === m.userId ? null : m.userId)}
                style={{ minHeight: 32, display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: highlight === m.userId ? 'var(--sunken)' : 'transparent', borderRadius: 999, padding: '0 10px', opacity: dim ? 0.4 : 1 }}>
                <div style={{ width: 16, height: 3, borderRadius: 2, background: memberColor(challenge, m.userId) }} />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{m.name}</span>
              </button>
              {isMe && onSetColor && (
                <button type="button" aria-label="改顏色" className="tap" onClick={() => setPickerOpen(!pickerOpen)} title="改顏色"
                  style={{ border: 'none', background: 'transparent', color: 'var(--text-faint)', padding: 2, display: 'flex' }}><Icon name="palette" size={16} /></button>
              )}
            </div>
          );
        })}
      </div>
      {pickerOpen && (
        <ColorPicker
          current={memberColor(challenge, myUserId)}
          onPick={async (hex) => { try { await onSetColor(challenge.id, hex); setPickerOpen(false); } catch (e) { alertError('更新顏色', e); } }}
        />
      )}
    </section>
  );
}

function ColorPicker({ current, onPick }) {
  return (
    <div style={{ marginTop: 10, padding: 12, background: 'var(--sunken)', borderRadius: 10, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {MEMBER_PALETTE.map(hex => (
        <button key={hex} type="button" aria-label={`顏色 ${hex}`} aria-pressed={hex === current} onClick={() => onPick(hex)}
          style={{ width: 28, height: 28, padding: 0, border: 'none', borderRadius: 999, background: hex, boxShadow: hex === current ? '0 0 0 2px var(--sunken), 0 0 0 4px var(--text)' : 'none' }} />
      ))}
    </div>
  );
}

function EntryForm({ challenge, myUserId, onSubmit, onRemove, onSetWeights }) {
  const [kg, setKg] = useState('');
  const [startWeight, setStartWeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [date, setDate] = useState(lastFriday());
  const [weightMsg, setWeightMsg] = useState(null); // {kind:'success'|'error', text}
  const [entryMsg, setEntryMsg] = useState(null); // {kind:'success'|'error', text}
  const [busy, setBusy] = useState(false);
  const [editingWeek, setEditingWeek] = useState(null); // Which week is currently being edited (identified by week_label to avoid duplicate additions when changing the date)

  const myEntries = challenge.entries
    .filter(e => e.userId === myUserId)
    .sort((a, b) => b.weekLabel.localeCompare(a.weekLabel));
  const me = challenge.members.find((m) => m.userId === myUserId) || null;
  const parsedStartWeight = parseFloat(startWeight);
  const parsedCurrentWeight = parseFloat(currentWeight);
  const hasStartWeight = !isNaN(parsedStartWeight);
  const hasCurrentWeight = !isNaN(parsedCurrentWeight);
  const assistedKgDiff = hasStartWeight && hasCurrentWeight ? Math.round((parsedCurrentWeight - parsedStartWeight) * 10) / 10 : null;

  React.useEffect(() => {
    setStartWeight(me?.startWeight === null || me?.startWeight === undefined ? '' : String(me.startWeight));
    setCurrentWeight(me?.currentWeight === null || me?.currentWeight === undefined ? '' : String(me.currentWeight));
  }, [me?.startWeight, me?.currentWeight, challenge.id]);

  const startEdit = (e) => {
    setEditingWeek(e.weekLabel);
    setKg(String(e.kgDiff));
    setDate(e.weekLabel);
    setEntryMsg(null);
  };
  const cancelEdit = () => {
    setEditingWeek(null);
    setKg('');
    setDate(lastFriday());
    setEntryMsg(null);
  };

  const persistWeights = async () => {
    if (!hasStartWeight && !hasCurrentWeight) { setWeightMsg({ kind:'error', text:'請先填起始體重或當前體重' }); return; }
    setBusy(true);
    try {
      await onSetWeights(challenge.id, {
        startWeight: hasStartWeight ? parsedStartWeight : null,
        currentWeight: hasCurrentWeight ? parsedCurrentWeight : null,
      });
      setWeightMsg({ kind:'success', text:'已更新體重紀錄' });
      setTimeout(() => setWeightMsg(null), 2500);
    } catch (e) {
      setWeightMsg({ kind:'error', text: e.message || '更新失敗' });
    } finally {
      setBusy(false);
    }
  };

  const submit = async (assistedValue = null) => {
    const manualKgDiff = parseFloat(kg);
    const n = assistedValue ?? (!isNaN(manualKgDiff) ? manualKgDiff : assistedKgDiff);
    if (isNaN(n)) { setEntryMsg({ kind:'error', text:'請輸入有效數字（例如 -2.5）' }); return; }
    setBusy(true);
    try {
      // The date remains fixed to the original week_label when editing to avoid duplicate additions when changing the date
      await onSubmit({
        challengeId: challenge.id,
        kgDiff: n,
        weekLabel: editingWeek || date,
      });
      setEntryMsg({ kind:'success', text:`已${editingWeek ? '更新' : '記錄'} ${n > 0 ? '+' : ''}${n} kg` });
      setKg('');
      setEditingWeek(null);
      setTimeout(() => setEntryMsg(null), 2500);
    } catch (e) {
      setEntryMsg({ kind:'error', text: e.message || '送出失敗' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section style={S.card}>
        <h2 style={{ ...UI.sectionTitle, marginBottom: 4 }}>體重紀錄（選填）</h2>
        <div style={{ ...S.hint, marginBottom: 14 }}>可另外記起始體重與當前體重，幫你核對數字並協助換算公斤差值</div>

        <div style={S.fields}>
          <label style={S.field}><span style={UI.fieldLabel}>起始體重</span>
            <input aria-label="起始體重" type="text" inputMode="decimal" value={startWeight} onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) setStartWeight(e.target.value); }} placeholder="60.0" style={UI.input} />
          </label>
          <label style={S.field}><span style={UI.fieldLabel}>當前體重</span>
            <input aria-label="當前體重" type="text" inputMode="decimal" value={currentWeight} onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value)) setCurrentWeight(e.target.value); }} placeholder="57.5" style={UI.input} />
          </label>
        </div>

        <div style={S.assist}>
          <div style={UI.fieldLabel}>自動計算差值</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: assistedKgDiff === null ? 'var(--text-faint)' : diffColor(assistedKgDiff), ...UI.num }}>
            {assistedKgDiff === null ? '兩個體重都填了才會自動算差值' : `${assistedKgDiff > 0 ? '+' : ''}${assistedKgDiff.toFixed(1)} kg`}
          </div>
        </div>

        {weightMsg && <div style={S.entryMsg(weightMsg.kind)}>{weightMsg.text}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" disabled={assistedKgDiff === null || busy} onClick={() => submit(assistedKgDiff)}
            style={{ ...UI.btnSecondary, flex: 1, minHeight: 44, opacity: assistedKgDiff === null || busy ? 0.5 : 1 }}>{busy ? '送出中…' : '用差值送出'}</button>
          <button type="button" onClick={persistWeights} disabled={busy}
            style={{ ...UI.btnNeutral, flex: 1, minHeight: 44, opacity: busy ? 0.6 : 1 }}>{busy ? '儲存中…' : '儲存體重'}</button>
        </div>
      </section>

      <section style={S.card}>
        <h2 style={{ ...UI.sectionTitle, marginBottom: 4 }}>本週登記</h2>
        <div style={{ ...S.hint, marginBottom: 14 }}>從挑戰開始到現在的體重差值（減重用負數，例如 -2.5）</div>

        <div style={S.fields}>
          <div style={S.field}>
            <span style={UI.fieldLabel}>公斤差值</span>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>
              {/* 有些手機鍵盤打不出負號，所以用按鈕切換正負，不用打字也行 */}
              <button aria-label="切換正負號" type="button" onClick={() => setKg((v) => v.startsWith('-') ? v.slice(1) : v ? `-${v}` : '-')}
                style={{ ...UI.btnNeutral, width: 44, padding: 0, fontSize: 18, flexShrink: 0 }}>±</button>
              <input aria-label="體重變化（公斤）" type="text" inputMode="decimal" value={kg} onChange={(e) => { if (/^-?\d*\.?\d*$/.test(e.target.value)) setKg(e.target.value); }} placeholder="-2.5"
                style={{ ...UI.input, flex: 1, minWidth: 0, textAlign: 'center', fontSize: 18, fontWeight: 600, ...UI.num }} />
            </div>
          </div>
          <label style={S.field}><span style={UI.fieldLabel}>日期（週五）</span>
            <input aria-label="日期" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={!!editingWeek}
              style={{ ...UI.input, ...(editingWeek ? { background: 'var(--sunken)', color: 'var(--text-faint)' } : {}) }} />
          </label>
        </div>

        {entryMsg && <div style={S.entryMsg(entryMsg.kind)}>{entryMsg.text}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => submit()} disabled={busy} style={{ ...UI.btnPrimary, flex: 1, opacity: busy ? 0.6 : 1 }}>{busy ? '送出中…' : editingWeek ? '更新記錄' : '送出記錄'}</button>
          {editingWeek && <button type="button" onClick={cancelEdit} style={{ ...UI.btnNeutral, minHeight: 48 }}>取消</button>}
        </div>

        {myEntries.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <div style={{ ...UI.fieldLabel, marginBottom: 10 }}>我的登記紀錄（{myEntries.length} 筆）</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
              {myEntries.map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 6px 6px 12px', background: editingWeek === e.weekLabel ? 'var(--primary-soft)' : 'var(--sunken)', borderRadius: 10 }}>
                  <div style={{ minWidth: 0, flex: 1, fontSize: 13, color: 'var(--text-muted)', ...UI.num }}>{e.weekLabel}</div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: diffColor(e.kgDiff), ...UI.num }}>{fmtKgDiff(e.kgDiff)}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" aria-label="編輯紀錄" onClick={() => startEdit(e)} style={S.smallBtn}><Icon name="pencil" size={16} /></button>
                    <button type="button" aria-label="刪除紀錄" onClick={async () => { if (await confirmDialog({ title: '刪除這筆體重紀錄？', confirmText: '刪除', danger: true })) { if (editingWeek === e.weekLabel) cancelEdit(); await onRemove(e.id).catch((err) => alertError('刪除紀錄', err)); } }} style={S.smallBtn}><Icon name="trash" size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function EndedChallengeCard({ challenge, myUserId, onSelect, active }) {
  const lb = computeLeaderboard(challenge, myUserId);
  const winner = lb[0];
  return (
    <button type="button" aria-pressed={active} onClick={onSelect}
      style={{ ...UI.row, ...UI.card, boxShadow: active ? '0 0 0 2px var(--primary-ink)' : 'var(--shadow-card)' }}>
      <span style={UI.rowText}>
        <span style={{ ...UI.rowTitle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{challenge.name}</span>
        <span style={UI.rowMeta}>{dateLabel(challenge.startDate)} → {dateLabel(challenge.endDate)}</span>
      </span>
      <span style={{ textAlign: 'right', flexShrink: 0 }}>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>冠軍</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 500, color: 'var(--warning-ink)' }}><Icon name="trophy" size={14} />{winner?.name || '—'}</span>
      </span>
    </button>
  );
}

// Creator only: click "Edit" to expand the input field for modifying the challenge name
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
      <button type="button" onClick={() => { setName(challenge.name); setEditing(true); setErr(''); }} style={{ ...UI.row, minHeight: 48, padding: '0 12px', background: 'var(--sunken)', borderRadius: 10 }}>
        <Icon name="pencil" size={16} style={{ color: 'var(--text-muted)' }} />
        <span style={{ flex: 1, fontSize: 14, color: 'var(--text-muted)' }}>挑戰名稱</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{challenge.name}</span>
        <Icon name="chevron-right" size={16} style={{ color: 'var(--text-faint)' }} />
      </button>
    );
  }
  return (
    <div style={S.editBox}>
      <label><span style={UI.fieldLabel}>新的挑戰名稱</span>
        <input aria-label="新的挑戰名稱" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus style={UI.input} />
      </label>
      {err && <div style={UI.fieldError}>{err}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={save} disabled={busy} style={{ ...UI.btnPrimary, flex: 1, minHeight: 44, fontSize: 14, opacity: busy ? 0.6 : 1 }}>{busy ? '儲存中…' : '儲存'}</button>
        <button type="button" onClick={() => setEditing(false)} style={{ ...UI.btnNeutral, flex: 1, minHeight: 44, background: 'var(--surface)' }}>取消</button>
      </div>
    </div>
  );
}

// Creator only: click "Edit" to expand date fields for modifying the end date
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
      <button type="button" onClick={() => { setDate(challenge.endDate); setEditing(true); setErr(''); }} style={{ ...UI.row, minHeight: 48, padding: '0 12px', background: 'var(--sunken)', borderRadius: 10 }}>
        <Icon name="calendar" size={16} style={{ color: 'var(--text-muted)' }} />
        <span style={{ flex: 1, fontSize: 14, color: 'var(--text-muted)' }}>結束日期</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', ...UI.num }}>{challenge.endDate}</span>
        <Icon name="chevron-right" size={16} style={{ color: 'var(--text-faint)' }} />
      </button>
    );
  }
  return (
    <div style={S.editBox}>
      <label><span style={UI.fieldLabel}>新的結束日期</span>
        <input aria-label="新的結束日期" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={UI.input} />
      </label>
      {err && <div style={UI.fieldError}>{err}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={save} disabled={busy} style={{ ...UI.btnPrimary, flex: 1, minHeight: 44, fontSize: 14, opacity: busy ? 0.6 : 1 }}>{busy ? '儲存中…' : '儲存'}</button>
        <button type="button" onClick={() => setEditing(false)} style={{ ...UI.btnNeutral, flex: 1, minHeight: 44, background: 'var(--surface)' }}>取消</button>
      </div>
    </div>
  );
}

function Avatar({ name, color, size = 32, border = 'none' }) {
  // If the name is in the format @xxx (fallback name from email), skip @ and use the next character as the avatar
  const raw = name || '?';
  const initial = (raw.startsWith('@') ? raw.slice(1, 2) : raw.slice(0, 1)) || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, background: color || 'var(--text-faint)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.42), fontWeight: 600, color: readableOn(color), flexShrink: 0, border,
    }}>{initial}</div>
  );
}
