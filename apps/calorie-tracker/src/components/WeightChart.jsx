// Weight challenge — weekly line chart (one curve per member, UP = more weight lost)
import React from 'react';
import { memberColor } from '../selectors.js';

export default function WeightChart({ challenge, highlightUserId = null, selectedWeek = null, onSelectWeek = null }) {
  const entries = challenge.entries;
  if (!entries.length) return null;

  const allWeeks = [...new Set(entries.map(e => e.weekLabel))].sort();
  if (!allWeeks.length) return null;

  const W = 580, H = 280;
  // Reduce right padding (name+kg labels are no longer placed there, names are shown in the bottom legend instead)
  const PAD = { l: 26, r: 16, t: 18, b: 36 };
  const cW = W - PAD.l - PAD.r, cH = H - PAD.t - PAD.b;

  // Y-axis: remove negative sign from kgDiff, so UP = more weight lost
  const allVals = entries.map(e => -e.kgDiff);
  const yMax = Math.max(...allVals, 0.5) * 1.18;
  const yMin = Math.min(...allVals, 0) - 0.15;
  const yRange = yMax - yMin;

  const xS = (i) => allWeeks.length <= 1 ? PAD.l + cW / 2 : PAD.l + (i / (allWeeks.length - 1)) * cW;
  const yS = (v) => H - PAD.b - ((v - yMin) / yRange) * cH;
  const zY = yS(0);

  const linePath = (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}>
        <defs>
          {challenge.members.map(m => (
            <linearGradient key={m.userId} id={`wc_g_${m.userId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={memberColor(challenge, m.userId)} stopOpacity="0.22" />
              <stop offset="100%" stopColor={memberColor(challenge, m.userId)} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Grid lines */}
        {Array.from({ length: Math.floor(yMax * 2) + 1 }).map((_, idx) => {
          const v = idx * 0.5;
          if (v < 0.5) return null;
          const y = yS(v);
          if (y < PAD.t) return null;
          return (
            <g key={`grid${idx}`}>
              <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#EEF4F0" strokeWidth={1} />
              <text x={PAD.l - 6} y={y + 4} textAnchor="end" fill="#bcccc2" fontSize={10}>{v.toFixed(1)}</text>
            </g>
          );
        })}

        {/* Zero line */}
        {zY >= PAD.t && zY <= H - PAD.b && (
          <g>
            <line x1={PAD.l} y1={zY} x2={W - PAD.r} y2={zY} stroke="#9bb0a3" strokeWidth={1.5} strokeDasharray="6,5" opacity={0.6} />
            <text x={PAD.l - 6} y={zY + 4} textAnchor="end" fill="#9bb0a3" fontSize={10}>0</text>
          </g>
        )}

        {/* X axis labels — 週數太多時只挑幾個顯示，避免擠成一團 */}
        {(() => {
          const maxLabels = 8;
          const step = Math.max(1, Math.ceil(allWeeks.length / maxLabels));
          return allWeeks.map((w, i) => {
            if (i % step !== 0 && i !== allWeeks.length - 1) return null;
            const x = xS(i);
            return (
              <g key={`x${i}`}>
                <line x1={x} y1={H - PAD.b} x2={x} y2={H - PAD.b + 5} stroke="#bcccc2" strokeWidth={1} />
                <text x={x} y={H - PAD.b + 18} textAnchor="middle" fill="#6E8B7C" fontSize={11} fontWeight={700}>{w.slice(5).replace('-', '/')}</text>
              </g>
            );
          });
        })()}

        {/* Each member — 有人被選中時，其他人淡化、不畫面積填色，被選中的畫最後（蓋在最上層） */}
        {[...challenge.members].sort((a, b) => (a.userId === highlightUserId ? 1 : 0) - (b.userId === highlightUserId ? 1 : 0)).map(m => {
          const pe = entries.filter(e => e.userId === m.userId).sort((a, b) => a.weekLabel.localeCompare(b.weekLabel));
          if (!pe.length) return null;
          const color = memberColor(challenge, m.userId);
          const isDim = highlightUserId && highlightUserId !== m.userId;
          const pts = pe.map(e => ({ x: xS(allWeeks.indexOf(e.weekLabel)), y: yS(-e.kgDiff) }));
          const path = linePath(pts);
          const last = pts[pts.length - 1];
          const area = path + ` L${last.x.toFixed(1)},${zY.toFixed(1)} L${pts[0].x.toFixed(1)},${zY.toFixed(1)} Z`;
          // Fill area color only when highlighting a single line; when multiple lines are shown, overlapping areas look like a big shadow, so removing it keeps it cleaner
          const showArea = highlightUserId === m.userId;
          return (
            <g key={`m${m.userId}`} opacity={isDim ? 0.18 : 1}>
              {showArea && <path d={area} fill={`url(#wc_g_${m.userId})`} />}
              <path d={path} fill="none" stroke={color} strokeWidth={highlightUserId === m.userId ? 3 : 2} strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, i) => {
                const isSelected = selectedWeek === pe[i].weekLabel;
                return (
                  <circle key={`p${i}`} cx={p.x} cy={p.y} r={isSelected ? 6.5 : (isDim ? 2.5 : 3.5)} fill={color} stroke="#fff" strokeWidth={isSelected ? 2 : 1.5} />
                );
              })}
            </g>
          );
        })}

        {/* Selected week indicator line */}
        {selectedWeek && (() => {
          const idx = allWeeks.indexOf(selectedWeek);
          if (idx === -1) return null;
          const x = xS(idx);
          return (
            <line x1={x} y1={PAD.t} x2={x} y2={H - PAD.b} stroke="#2E8B5E" strokeWidth={1.5} strokeDasharray="4,4" pointerEvents="none" />
          );
        })()}

        {/* Clickable week columns */}
        {onSelectWeek && allWeeks.map((w, i) => {
          const xCenter = xS(i);
          const colW = allWeeks.length <= 1 ? cW : cW / (allWeeks.length - 1);
          const x = xCenter - colW / 2;
          return (
            <rect key={`click-col-${i}`} x={x} y={PAD.t} width={colW} height={cH}
              fill="transparent" cursor="pointer" onClick={() => onSelectWeek(selectedWeek === w ? null : w)} />
          );
        })}
      </svg>
    </div>
  );
}
