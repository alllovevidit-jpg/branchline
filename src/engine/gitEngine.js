export const BRANCH_COLORS = {
  main: '#38BDF8',
  'feat/auth': '#10B981',
  'feat/ui': '#A855F7',
  'feat/scale': '#F59E0B',
  hotfix: '#F43F5E',
};

const PALETTE = ['#10B981', '#A855F7', '#F59E0B', '#EC4899', '#06B6D4'];

export function getBranchColor(name, index = 0) {
  return BRANCH_COLORS[name] || PALETTE[index % PALETTE.length];
}

export function generateHash() {
  return Math.random().toString(16).substring(2, 9);
}

export function resolveHeadCommitId(state) {
  if (state.HEAD.type === 'branch') {
    return state.branches[state.HEAD.ref];
  }
  return state.HEAD.ref;
}

export function findLCA(commits, commitA, commitB) {
  if (!commitA || !commitB) return null;
  if (commitA === commitB) return commitA;

  const ancestorsA = new Set();
  const queueA = [commitA];

  while (queueA.length > 0) {
    const curr = queueA.shift();
    if (!curr || ancestorsA.has(curr)) continue;
    ancestorsA.add(curr);
    const node = commits[curr];
    if (node && node.parents) {
      queueA.push(...node.parents);
    }
  }

  const queueB = [commitB];
  const visitedB = new Set();
  while (queueB.length > 0) {
    const curr = queueB.shift();
    if (!curr || visitedB.has(curr)) continue;
    if (ancestorsA.has(curr)) return curr;
    visitedB.add(curr);
    const node = commits[curr];
    if (node && node.parents) {
      queueB.push(...node.parents);
    }
  }
  return null;
}

export function executeGitCommand(state, rawInput) {
  const input = rawInput.trim();
  const next = structuredClone(state);

  const log = (cmd, output, status = 'info') => {
    next.logs.push({ id: Date.now() + Math.random(), cmd, output, status });
  };

  if (!input) return next;

  const commitMatch = input.match(/^git\s+commit\s+-m\s+["'](.+)["']$/i);
  if (commitMatch) {
    const message = commitMatch[1];
    const parentId = resolveHeadCommitId(next);
    const newId = generateHash();
    const parentNode = next.commits[parentId];
    const currentBranch = next.HEAD.type === 'branch' ? next.HEAD.ref : 'detached';

    const newFiles = { ...(parentNode?.files || {}) };
    newFiles['app.js'] = `// ${message} (${newId})`;

    next.commits[newId] = {
      id: newId,
      message,
      parents: parentId ? [parentId] : [],
      branchHint: currentBranch,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      files: newFiles,
      orphaned: false,
    };

    if (next.HEAD.type === 'branch') {
      next.branches[next.HEAD.ref] = newId;
    } else {
      next.HEAD.ref = newId;
    }

    next.selectedCommit = newId;
    log(input, `[${currentBranch} ${newId}] ${message}`, 'success');
    return next;
  }

  const checkoutNewMatch = input.match(/^git\s+(?:checkout\s+-b|switch\s+-c)\s+([\w/-]+)$/i);
  if (checkoutNewMatch) {
    const branchName = checkoutNewMatch[1];
    if (next.branches[branchName]) {
      log(input, `fatal: A branch named '${branchName}' already exists.`, 'error');
      return next;
    }
    const currentCommit = resolveHeadCommitId(next);
    next.branches[branchName] = currentCommit;
    next.HEAD = { type: 'branch', ref: branchName };
    log(input, `Switched to a new branch '${branchName}'`, 'success');
    return next;
  }

  const branchMatch = input.match(/^git\s+branch\s+([\w/-]+)$/i);
  if (branchMatch) {
    const branchName = branchMatch[1];
    if (next.branches[branchName]) {
      log(input, `fatal: A branch named '${branchName}' already exists.`, 'error');
      return next;
    }
    next.branches[branchName] = resolveHeadCommitId(next);
    log(input, `Created branch '${branchName}' at ${next.branches[branchName]}`, 'success');
    return next;
  }

  const checkoutMatch = input.match(/^git\s+(?:checkout|switch)\s+([\w/-]+)$/i);
  if (checkoutMatch) {
    const target = checkoutMatch[1];
    if (next.branches[target]) {
      next.HEAD = { type: 'branch', ref: target };
      next.selectedCommit = next.branches[target];
      log(input, `Switched to branch '${target}'`, 'info');
      return next;
    }
    if (next.commits[target]) {
      next.HEAD = { type: 'commit', ref: target };
      next.selectedCommit = target;
      log(input, `Note: switching to '${target}'. You are in 'detached HEAD' state.`, 'warn');
      return next;
    }
    log(input, `error: pathspec '${target}' did not match any branch or commit known to git`, 'error');
    return next;
  }

  const mergeMatch = input.match(/^git\s+merge\s+([\w/-]+)$/i);
  if (mergeMatch) {
    const sourceBranch = mergeMatch[1];
    if (next.HEAD.type !== 'branch') {
      log(input, `fatal: cannot merge while in detached HEAD state.`, 'error');
      return next;
    }
    const targetBranch = next.HEAD.ref;
    const sourceCommitId = next.branches[sourceBranch];
    const targetCommitId = next.branches[targetBranch];

    if (!sourceCommitId) {
      log(input, `merge: ${sourceBranch} - not something we can merge`, 'error');
      return next;
    }
    if (sourceCommitId === targetCommitId) {
      log(input, `Already up to date.`, 'info');
      return next;
    }

    const lcaId = findLCA(next.commits, targetCommitId, sourceCommitId);

    if (lcaId === targetCommitId) {
      next.branches[targetBranch] = sourceCommitId;
      next.selectedCommit = sourceCommitId;
      log(input, `Fast-forward merge: ${targetBranch} -> ${sourceCommitId} (LCA: ${lcaId})`, 'success');
      return next;
    }

    const lcaNode = next.commits[lcaId];
    const targetNode = next.commits[targetCommitId];
    const sourceNode = next.commits[sourceCommitId];

    const baseApp = lcaNode?.files?.['app.js'] || '';
    const oursApp = targetNode?.files?.['app.js'] || '';
    const theirsApp = sourceNode?.files?.['app.js'] || '';

    if (oursApp !== baseApp && theirsApp !== baseApp && oursApp !== theirsApp) {
      next.conflict = {
        file: 'app.js',
        lcaId,
        oursBranch: targetBranch,
        theirsBranch: sourceBranch,
        oursCommit: targetCommitId,
        theirsCommit: sourceCommitId,
        baseContent: baseApp,
        oursContent: oursApp,
        theirsContent: theirsApp,
      };
      log(input, `CONFLICT (content): Merge conflict in app.js (LCA: ${lcaId}). Resolve in Inspector ->`, 'error');
      return next;
    }

    const mergeId = generateHash();
    next.commits[mergeId] = {
      id: mergeId,
      message: `Merge branch '${sourceBranch}' into ${targetBranch}`,
      parents: [targetCommitId, sourceCommitId],
      branchHint: targetBranch,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      files: { ...targetNode.files, ...sourceNode.files },
      orphaned: false,
    };
    next.branches[targetBranch] = mergeId;
    next.selectedCommit = mergeId;
    log(input, `Merge made by the 'ort' strategy (LCA: ${lcaId}) -> [${mergeId}]`, 'success');
    return next;
  }

  const rebaseMatch = input.match(/^git\s+rebase\s+([\w/-]+)$/i);
  if (rebaseMatch) {
    const ontoBranch = rebaseMatch[1];
    if (next.HEAD.type !== 'branch') {
      log(input, `fatal: cannot rebase in detached HEAD state`, 'error');
      return next;
    }
    const currentBranch = next.HEAD.ref;
    const ontoCommitId = next.branches[ontoBranch];
    const currentCommitId = next.branches[currentBranch];

    if (!ontoCommitId) {
      log(input, `fatal: invalid upstream '${ontoBranch}'`, 'error');
      return next;
    }

    const lcaId = findLCA(next.commits, currentCommitId, ontoCommitId);
    if (!lcaId || lcaId === currentCommitId) {
      log(input, `Current branch ${currentBranch} is up to date.`, 'info');
      return next;
    }

    const toReplay = [];
    let curr = currentCommitId;
    while (curr && curr !== lcaId) {
      const node = next.commits[curr];
      if (!node) break;
      toReplay.unshift(node);
      curr = node.parents[0];
    }

    let newParent = ontoCommitId;
    toReplay.forEach((oldNode) => {
      next.commits[oldNode.id].orphaned = true;
      const clonedId = generateHash();
      next.commits[clonedId] = {
        ...oldNode,
        id: clonedId,
        parents: [newParent],
        rebasedFrom: oldNode.id,
        orphaned: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      newParent = clonedId;
    });

    next.branches[currentBranch] = newParent;
    next.selectedCommit = newParent;
    log(
      input,
      `Successfully rebased ${toReplay.length} commit(s) onto ${ontoBranch} (new tip: ${newParent})`,
      'success'
    );
    return next;
  }

  if (/^git\s+reset\s+--hard\s+HEAD~1$/i.test(input)) {
    const currId = resolveHeadCommitId(next);
    const currNode = next.commits[currId];
    if (!currNode || currNode.parents.length === 0) {
      log(input, `fatal: Cannot reset past initial root commit.`, 'error');
      return next;
    }
    const parentId = currNode.parents[0];
    currNode.orphaned = true;
    if (next.HEAD.type === 'branch') {
      next.branches[next.HEAD.ref] = parentId;
    } else {
      next.HEAD.ref = parentId;
    }
    next.selectedCommit = parentId;
    log(input, `HEAD is now at ${parentId} ${next.commits[parentId].message}`, 'warn');
    return next;
  }

  log(
    input,
    `Supported commands: git commit -m "msg" | git checkout -b <br> | git checkout <br/sha> | git merge <br> | git rebase <br> | git reset --hard HEAD~1`,
    'error'
  );
  return next;
}