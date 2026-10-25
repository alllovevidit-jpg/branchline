import React, { useState, useRef, useEffect } from 'react';
import { Terminal, GitCommit, GitBranch, GitMerge, GitPullRequest, Undo2, Play } from 'lucide-react';

export default function TerminalPane({ state, onRunCommand }) {
  const [cmdInput, setCmdInput] = useState('');
  const [commitMsg, setCommitMsg] = useState('feat: add endpoint');
  const [newBranch, setNewBranch] = useState('feat/cache');
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.logs]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!cmdInput.trim()) return;
    onRunCommand(cmdInput);
    setCmdInput('');
  };

  const branches = Object.keys(state.branches);
  const currentBranch = state.HEAD.type === 'branch' ? state.HEAD.ref : null;
  const otherBranches = branches.filter((b) => b !== currentBranch);

  return (
    <aside className="side-panel left">
      <div className="panel-section">
        <div className="section-header">
          <span>Quick Operations</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'var(--text-muted)' }}>
            1-Click DAG Controls
          </span>
        </div>

        <div className="control-row">
          <input
            type="text"
            className="ui-input"
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            placeholder="Commit message..."
          />
          <button
            className="ui-btn cyan"
            onClick={() => onRunCommand(`git commit -m "${commitMsg || 'chore: update'}"`)}
          >
            <GitCommit size={14} />
            Commit
          </button>
        </div>

        <div className="control-row">
          <input
            type="text"
            className="ui-input"
            value={newBranch}
            onChange={(e) => setNewBranch(e.target.value)}
            placeholder="branch-name"
          />
          <button
            className="ui-btn emerald"
            onClick={() => onRunCommand(`git checkout -b ${newBranch || 'feat/new'}`)}
          >
            <GitBranch size={14} />
            Branch
          </button>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', fontFamily: 'JetBrains Mono' }}>
            Switch Active Branch:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {branches.map((b) => {
              const active = state.HEAD.type === 'branch' && state.HEAD.ref === b;
              return (
                <button
                  key={b}
                  onClick={() => onRunCommand(`git checkout ${b}`)}
                  className={`ui-btn ${active ? 'cyan' : ''}`}
                  style={{ padding: '5px 10px', fontSize: '11px' }}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </div>

        {otherBranches.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {otherBranches.map((b) => (
              <React.Fragment key={b}>
                <button className="ui-btn" onClick={() => onRunCommand(`git merge ${b}`)}>
                  <GitMerge size={13} color="var(--cyan)" />
                  merge {b}
                </button>
                <button className="ui-btn" onClick={() => onRunCommand(`git rebase ${b}`)}>
                  <GitPullRequest size={13} color="var(--violet)" />
                  rebase {b}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        <button className="ui-btn rose" onClick={() => onRunCommand('git reset --hard HEAD~1')}>
          <Undo2 size={14} />
          git reset --hard HEAD~1
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg-input)' }}>
        <div style={{
          padding: '10px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'JetBrains Mono',
          fontSize: '11px',
          color: 'var(--text-secondary)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={13} color="var(--cyan)" />
            git-sh interactive shell
          </span>
          <span style={{ display: 'flex', gap: '5px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F43F5E' }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
          </span>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          fontFamily: 'JetBrains Mono',
          fontSize: '11.5px'
        }}>
          {state.logs.map((entry) => (
            <div key={entry.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--emerald)' }}>➜</span>
                <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>repo</span>
                <span style={{ color: 'var(--text-main)' }}>{entry.cmd}</span>
              </div>
              <div style={{
                paddingLeft: '16px',
                lineHeight: 1.5,
                color:
                  entry.status === 'error'
                    ? 'var(--rose)'
                    : entry.status === 'warn'
                    ? 'var(--amber)'
                    : entry.status === 'success'
                    ? 'var(--emerald)'
                    : 'var(--text-secondary)'
              }}>
                {entry.output}
              </div>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>

        <form onSubmit={handleFormSubmit} style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-panel)' }}>
          <div className="control-row">
            <input
              type="text"
              className="ui-input"
              value={cmdInput}
              onChange={(e) => setCmdInput(e.target.value)}
              placeholder='git commit -m "feat: api"'
            />
            <button type="submit" className="ui-btn cyan">
              <Play size={13} />
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}