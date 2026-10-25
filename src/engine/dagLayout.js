import { getBranchColor } from './gitEngine';

export function computeDagLayout(state) {
  const commits = Object.values(state.commits);
  const LANE_ORDER = ['main', 'feat/auth', 'feat/ui', 'feat/scale', 'hotfix', 'detached'];

  const getLaneIndex = (branchHint) => {
    const idx = LANE_ORDER.indexOf(branchHint);
    if (idx !== -1) return idx;
    const dynamicBranches = Object.keys(state.branches);
    const dynIdx = dynamicBranches.indexOf(branchHint);
    return dynIdx !== -1 ? dynIdx : 2;
  };

  const depthMap = {};
  const computeDepth = (id, visited = new Set()) => {
    if (depthMap[id] !== undefined) return depthMap[id];
    if (visited.has(id)) return 0;
    visited.add(id);
    const node = state.commits[id];
    if (!node || !node.parents || node.parents.length === 0) {
      depthMap[id] = 0;
      return 0;
    }
    const maxParent = Math.max(...node.parents.map((p) => computeDepth(p, visited)));
    depthMap[id] = maxParent + 1;
    return depthMap[id];
  };

  commits.forEach((c) => computeDepth(c.id));

  const X_START = 120;
  const X_GAP = 185;
  const Y_START = 120;
  const Y_GAP = 115;

  const occupied = new Set();
  const nodes = commits.map((c) => {
    let col = depthMap[c.id] || 0;
    let lane = getLaneIndex(c.branchHint);
    if (c.orphaned) lane += 0.65;

    while (occupied.has(`${col}:${lane}`)) {
      col += 1;
    }
    occupied.add(`${col}:${lane}`);

    return {
      ...c,
      x: X_START + col * X_GAP,
      y: Y_START + lane * Y_GAP,
      color: getBranchColor(c.branchHint, Math.floor(lane)),
    };
  });

  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const edges = [];
  nodes.forEach((node) => {
    node.parents.forEach((parentId, idx) => {
      const parent = nodeById[parentId];
      if (parent) {
        edges.push({
          id: `${parent.id}->${node.id}`,
          source: parent,
          target: node,
          isMergeEdge: idx === 1,
          orphaned: node.orphaned,
          color: node.color,
        });
      }
    });

    if (node.rebasedFrom && nodeById[node.rebasedFrom]) {
      edges.push({
        id: `rebase-${node.rebasedFrom}->${node.id}`,
        source: nodeById[node.rebasedFrom],
        target: node,
        isRebaseClone: true,
        color: '#A855F7',
      });
    }
  });

  return { nodes, edges, nodeById };
}