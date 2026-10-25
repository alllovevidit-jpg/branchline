import React, { useState } from 'react';
import TopBar from './components/TopBar';
import TerminalPane from './components/TerminalPane';
import DagCanvas from './components/DagCanvas';
import InspectorPane from './components/InspectorPane';
import { SCENARIOS } from './presets/scenarios';
import { executeGitCommand, generateHash } from './engine/gitEngine';

export default function App() {
  const [activeScenario, setActiveScenario] = useState('cleanMerge');
  const [gitState, setGitState] = useState(() =>
    structuredClone(SCENARIOS.cleanMerge.state)
  );

  const handleSelectScenario = (scenarioId) => {
    setActiveScenario(scenarioId);
    setGitState(structuredClone(SCENARIOS[scenarioId].state));
  };

  const handleReset = () => {
    setGitState(structuredClone(SCENARIOS[activeScenario].state));
  };

  const handleRunCommand = (cmd) => {
    setGitState((prev) => executeGitCommand(prev, cmd));
  };

  const handleSelectCommit = (commitId) => {
    setGitState((prev) => ({ ...prev, selectedCommit: commitId }));
  };

  const handleResolveConflict = (strategy) => {
    setGitState((prev) => {
      if (!prev.conflict) return prev;
      const next = structuredClone(prev);
      const { oursBranch, theirsBranch, oursCommit, theirsCommit, oursContent, theirsContent } =
        next.conflict;

      const resolvedContent =
        strategy === 'ours'
          ? oursContent
          : strategy === 'theirs'
          ? theirsContent
          : `${oursContent}\n${theirsContent}`;

      const mergeId = generateHash();
      next.commits[mergeId] = {
        id: mergeId,
        message: `Merge branch '${theirsBranch}' into ${oursBranch} (resolved)`,
        parents: [oursCommit, theirsCommit],
        branchHint: oursBranch,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        files: {
          ...next.commits[oursCommit].files,
          ...next.commits[theirsCommit].files,
          'app.js': resolvedContent,
        },
        orphaned: false,
      };

      next.branches[oursBranch] = mergeId;
      next.selectedCommit = mergeId;
      next.conflict = null;
      next.logs.push({
        id: Date.now(),
        cmd: `git commit -m "Merge branch '${theirsBranch}' (resolved via ${strategy})"`,
        output: `Resolved conflict in app.js -> created merge commit [${mergeId}]`,
        status: 'success',
      });
      return next;
    });
  };

  return (
    <div className="app-shell">
      <TopBar
        activeScenario={activeScenario}
        onSelectScenario={handleSelectScenario}
        onReset={handleReset}
        state={gitState}
      />
      <div className="workspace-grid">
        <TerminalPane state={gitState} onRunCommand={handleRunCommand} />
        <DagCanvas state={gitState} onSelectCommit={handleSelectCommit} />
        <InspectorPane state={gitState} onResolveConflict={handleResolveConflict} />
      </div>
    </div>
  );
}