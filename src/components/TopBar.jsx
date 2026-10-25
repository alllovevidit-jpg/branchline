import React from 'react';
import { GitBranch, Sparkles, RotateCcw, AlertTriangle, Cpu } from 'lucide-react';
import { SCENARIOS } from '../presets/scenarios';

export default function TopBar({ activeScenario, onSelectScenario, onReset, state }) {
  const isDetached = state.HEAD.type === 'commit';
  const hasConflict = Boolean(state.conflict);

  return (
    <header className="topbar">
      <div className="brand-box">
        <div className="brand-logo">
          <GitBranch size={18} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.02em' }}>
              Branchline
            </span>
            <span className="badge-version">DAG ENGINE v1.0</span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Interactive Git Internals &bull; LCA Traversal &bull; 3-Way Merge Visualizer
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="ui-btn" style={{ cursor: 'default' }}>
          <Cpu size={14} color="var(--amber)" />
          <span style={{ color: 'var(--text-secondary)' }}>HEAD:</span>
          <span style={{ color: isDetached ? 'var(--amber)' : 'var(--cyan)' }}>
            {isDetached ? `detached@${state.HEAD.ref}` : state.HEAD.ref}
          </span>
        </div>

        {hasConflict && (
          <div className="ui-btn rose">
            <AlertTriangle size={14} />
            <span>CONFLICT IN {state.conflict.file}</span>
          </div>
        )}

        <div className="scenario-bar">
          <Sparkles size={14} color="var(--violet)" style={{ margin: '0 6px' }} />
          {Object.values(SCENARIOS).map((sc) => (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className={`scenario-tab ${activeScenario === sc.id ? 'active' : ''}`}
            >
              {sc.name}
            </button>
          ))}
        </div>

        <button onClick={onReset} className="ui-btn" title="Reset Scenario">
          <RotateCcw size={15} />
        </button>
      </div>
    </header>
  );
}