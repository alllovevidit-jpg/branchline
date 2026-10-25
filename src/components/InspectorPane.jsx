import React from 'react';
import { FileCode2, GitCommit, Layers, AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function InspectorPane({ state, onResolveConflict }) {
  const commit = state.commits[state.selectedCommit];
  const conflict = state.conflict;

  return (
    <aside className="side-panel right">
      <div className="panel-section" style={{ borderBottom: 'none' }}>
        <div className="section-header" style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={15} color="var(--cyan)" />
            Git Object Inspector
          </span>
          <span className="badge-version">cat-file -p</span>
        </div>

        {conflict ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="meta-card" style={{ borderColor: 'rgba(244, 63, 94, 0.45)', background: 'rgba(244, 63, 94, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--rose)', fontWeight: 700 }}>
                <AlertOctagon size={15} />
                <span>3-WAY MERGE CONFLICT</span>
              </div>
              <p style={{ fontFamily: 'Inter', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Both <strong>{conflict.oursBranch}</strong> and <strong>{conflict.theirsBranch}</strong> modified{' '}
                <code>{conflict.file}</code> since LCA <code>{conflict.lcaId}</code>.
              </p>
            </div>

            <div className="meta-card">
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>1. BASE LCA ({conflict.lcaId})</span>
              <pre style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{conflict.baseContent}</pre>
            </div>

            <div className="meta-card" style={{ borderColor: 'rgba(56, 189, 248, 0.4)' }}>
              <span style={{ fontSize: '10px', color: 'var(--cyan)' }}>2. CURRENT ({conflict.oursBranch})</span>
              <pre style={{ color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{conflict.oursContent}</pre>
            </div>

            <div className="meta-card" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
              <span style={{ fontSize: '10px', color: 'var(--amber)' }}>3. INCOMING ({conflict.theirsBranch})</span>
              <pre style={{ color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{conflict.theirsContent}</pre>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="ui-btn cyan" onClick={() => onResolveConflict('ours')}>
                <CheckCircle2 size={14} /> Accept Current ({conflict.oursBranch})
              </button>
              <button className="ui-btn emerald" onClick={() => onResolveConflict('theirs')}>
                <CheckCircle2 size={14} /> Accept Incoming ({conflict.theirsBranch})
              </button>
              <button className="ui-btn violet" onClick={() => onResolveConflict('both')}>
                <CheckCircle2 size={14} /> Combine Both Changes
              </button>
            </div>
          </div>
        ) : commit ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="meta-card">
              <div className="meta-row">
                <span style={{ color: 'var(--text-muted)' }}>commit SHA</span>
                <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{commit.id}</span>
              </div>
              <div className="meta-row">
                <span style={{ color: 'var(--text-muted)' }}>parents</span>
                <span>{commit.parents.length > 0 ? commit.parents.join(', ') : 'root (none)'}</span>
              </div>
              <div className="meta-row">
                <span style={{ color: 'var(--text-muted)' }}>swimlane</span>
                <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>{commit.branchHint}</span>
              </div>
              <div className="meta-row">
                <span style={{ color: 'var(--text-muted)' }}>timestamp</span>
                <span style={{ color: 'var(--text-secondary)' }}>{commit.timestamp}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'JetBrains Mono' }}>
                <GitCommit size={13} color="var(--cyan)" /> Commit Message
              </div>
              <div className="meta-card">{commit.message}</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'JetBrains Mono' }}>
                <FileCode2 size={13} color="var(--emerald)" /> Working Tree Snapshot
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(commit.files || {}).map(([filename, content]) => (
                  <div key={filename} className="meta-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      {filename}
                    </div>
                    <pre style={{ padding: '12px', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {content}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}