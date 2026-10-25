import React from 'react';
import { computeDagLayout } from '../engine/dagLayout';
import { resolveHeadCommitId, findLCA } from '../engine/gitEngine';

export default function DagCanvas({ state, onSelectCommit }) {
  const { nodes, edges } = computeDagLayout(state);
  const headCommitId = resolveHeadCommitId(state);

  const branchEntries = Object.entries(state.branches);
  const mainId = state.branches.main;
  const activeLCA =
    headCommitId && mainId && headCommitId !== mainId
      ? findLCA(state.commits, mainId, headCommitId)
      : null;

  const maxX = Math.max(...nodes.map((n) => n.x), 880) + 260;
  const maxY = Math.max(...nodes.map((n) => n.y), 520) + 180;

  return (
    <main className="dag-viewport">
      <div style={{ padding: '0 20px' }}>
        <div className="legend-pill">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8' }} />
            main
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
            feature
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', border: '1.5px dashed #64748B' }} />
            orphaned / rebased
          </span>
          {activeLCA && (
            <span style={{ color: 'var(--amber)', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '14px' }}>
              LCA Merge Base: <strong>{activeLCA}</strong>
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: '30px 40px' }}>
        <svg width={maxX} height={maxY} style={{ userSelect: 'none', overflow: 'visible' }}>
          <defs>
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {edges.map((edge) => {
            const { source, target, isRebaseClone, orphaned } = edge;
            const dx = (target.x - source.x) * 0.52;
            const d = `M ${source.x} ${source.y} C ${source.x + dx} ${source.y}, ${target.x - dx} ${target.y}, ${target.x} ${target.y}`;

            return (
              <g key={edge.id}>
                {!orphaned && !isRebaseClone && (
                  <path d={d} fill="none" stroke={edge.color} strokeWidth={8} opacity={0.1} />
                )}
                <path
                  d={d}
                  fill="none"
                  stroke={isRebaseClone ? '#A855F7' : edge.color}
                  strokeWidth={isRebaseClone ? 2 : 3}
                  strokeDasharray={isRebaseClone ? '5 5' : orphaned ? '6 4' : undefined}
                  opacity={orphaned ? 0.28 : isRebaseClone ? 0.75 : 0.92}
                />
              </g>
            );
          })}

          {nodes.map((node) => {
            const isSelected = state.selectedCommit === node.id;
            const isHead = headCommitId === node.id;
            const isLCA = activeLCA === node.id;
            const attachedBranches = branchEntries.filter(([, cid]) => cid === node.id);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => onSelectCommit(node.id)}
                style={{ cursor: 'pointer' }}
              >
                {isSelected && <circle r={30} fill={node.color} opacity={0.14} />}

                {isHead && (
                  <circle
                    r={25}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    className="head-ring"
                  />
                )}

                {isLCA && (
                  <circle r={21} fill="none" stroke="#F59E0B" strokeWidth={1.5} opacity={0.85} />
                )}

                <circle
                  r={16}
                  fill="#0B0E17"
                  stroke={node.color}
                  strokeWidth={isSelected ? 3.5 : 2.5}
                  strokeDasharray={node.orphaned ? '3 3' : undefined}
                  opacity={node.orphaned ? 0.4 : 1}
                  filter={isSelected ? 'url(#neonGlow)' : undefined}
                />

                <circle r={5.5} fill={node.color} opacity={node.orphaned ? 0.35 : 1} />

                <rect
                  x={-35}
                  y={24}
                  width={70}
                  height={20}
                  rx={6}
                  fill="#111624"
                  stroke="rgba(255,255,255,0.1)"
                  opacity={node.orphaned ? 0.4 : 1}
                />
                <text
                  y={38}
                  textAnchor="middle"
                  fill={isSelected ? '#FFFFFF' : '#CBD5E1'}
                  style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', fontWeight: 600 }}
                  opacity={node.orphaned ? 0.4 : 1}
                >
                  {node.id}
                </text>

                <text
                  y={58}
                  textAnchor="middle"
                  fill="#94A3B8"
                  style={{ fontFamily: 'Inter', fontSize: '11px', fontWeight: 500 }}
                  opacity={node.orphaned ? 0.35 : 0.9}
                >
                  {node.message.length > 21 ? node.message.slice(0, 21) + '…' : node.message}
                </text>

                {attachedBranches.map(([bName], idx) => {
                  const tagY = -42 - idx * 28;
                  const isCurrentHeadBranch = state.HEAD.type === 'branch' && state.HEAD.ref === bName;
                  const label = isCurrentHeadBranch ? `HEAD → ${bName}` : bName;
                  const boxWidth = Math.max(label.length * 7.5 + 22, 92);

                  return (
                    <g key={bName} transform={`translate(0, ${tagY})`}>
                      <rect
                        x={-boxWidth / 2}
                        y={-12}
                        width={boxWidth}
                        height={24}
                        rx={6}
                        fill="#111624"
                        stroke={node.color}
                        strokeWidth={1.6}
                      />
                      <text
                        y={4}
                        textAnchor="middle"
                        fill="#F8FAFC"
                        style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', fontWeight: 600 }}
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}

                {state.HEAD.type === 'commit' && state.HEAD.ref === node.id && (
                  <g transform="translate(0, -42)">
                    <rect
                      x={-65}
                      y={-12}
                      width={130}
                      height={24}
                      rx={6}
                      fill="#2B1404"
                      stroke="#F59E0B"
                      strokeWidth={1.6}
                    />
                    <text
                      y={4}
                      textAnchor="middle"
                      fill="#FCD34D"
                      style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', fontWeight: 600 }}
                    >
                      HEAD (detached)
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </main>
  );
}