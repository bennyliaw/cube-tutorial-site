// Solves any state the way the tutorial teaches it: daisy cross, J Perm's
// intuitive F2L (U turns + "take a slot out / put it in"), then Ben's 2-look
// OLL and 2-look PLL. Deterministic; no AI at runtime. Returns a list of steps,
// each with the moves and a sentence in the tutorial's own vocabulary.
import { solved, apply, parse, normalize, clone, stateString } from './cube.js';
import { SOLVED, applyAlg, colourOf, fromCube } from './fast.js';
import { CASES } from './cases.js';

const off = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };
const S = (face, i) => off[face] + i;
const col = (st, face, i) => colourOf(st[S(face, i)]);
const same = (st, slots) => slots.every((i) => st[i] === i);

// --- goals ---------------------------------------------------------------
const CROSS = [S('D', 1), S('D', 3), S('D', 5), S('D', 7), S('F', 7), S('R', 7), S('B', 7), S('L', 7)];
export const SLOTS = {
  FR: { idx: [S('F', 5), S('F', 8), S('R', 3), S('R', 6), S('D', 2)], name: 'front-right' },
  FL: { idx: [S('F', 3), S('F', 6), S('L', 5), S('L', 8), S('D', 0)], name: 'front-left' },
  BR: { idx: [S('B', 3), S('B', 6), S('R', 5), S('R', 8), S('D', 8)], name: 'back-right' },
  BL: { idx: [S('B', 5), S('B', 8), S('L', 3), S('L', 6), S('D', 6)], name: 'back-left' },
};
const U_EDGES = [1, 3, 5, 7].map((i) => S('U', i));
export const goals = {
  cross: (st) => same(st, CROSS),
  slot: (k) => (st) => same(st, SLOTS[k].idx),
  f2l: (st) => same(st, CROSS) && Object.keys(SLOTS).every((k) => same(st, SLOTS[k].idx)),
  oll1: (st) => U_EDGES.every((i) => colourOf(st[i]) === 'Y'),
  oll2: (st) => Array.from({ length: 9 }, (_, i) => colourOf(st[i]) === 'Y').every(Boolean),
  pll1: (st) => AUFS.some((a) => cornersHome(applyAlg(st, a))),
  pll2: (st) => AUFS.some((a) => isSolvedFast(applyAlg(st, a))),
  solved: (st) => isSolvedFast(st),
};
const AUFS = ['', 'U', 'U2', "U'"];
const LL_CORNERS = [S('U', 0), S('U', 2), S('U', 6), S('U', 8), S('F', 0), S('F', 2), S('R', 0), S('R', 2), S('B', 0), S('B', 2), S('L', 0), S('L', 2)];
const cornersHome = (st) => same(st, LL_CORNERS);
const isSolvedFast = (st) => same(st, Array.from({ length: 54 }, (_, i) => i));

// --- cross: daisy, then match and drop -------------------------------------
const FACE_MOVES = ['U', 'D', 'R', 'L', 'F', 'B'].flatMap((f) => [f, f + "'", f + '2']);
const daisyCount = (st) => U_EDGES.filter((i) => colourOf(st[i]) === 'W').length;

function iddfs(st, goal, maxDepth, moves = FACE_MOVES) {
  const path = [];
  function dfs(s, depth, lastFace) {
    if (goal(s)) return true;
    if (depth === 0) return false;
    for (const m of moves) {
      const face = m[0];
      if (face === lastFace) continue;
      // opposite faces commute: only allow one order
      if ((face === 'D' && lastFace === 'U') || (face === 'L' && lastFace === 'R') || (face === 'B' && lastFace === 'F')) continue;
      path.push(m);
      if (dfs(applyAlg(s, m), depth - 1, face)) return true;
      path.pop();
    }
    return false;
  }
  for (let d = 0; d <= maxDepth; d++) if (dfs(st, d, null)) return path.slice();
  throw new Error('no solution within depth ' + maxDepth);
}

function solveCross(st, steps) {
  if (goals.cross(st)) return st;
  // Daisy: one more white edge up at a time, never knocking one off.
  while (daisyCount(st) < 4) {
    const k = daisyCount(st);
    const mv = iddfs(st, (s) => daisyCount(s) > k, 6);
    st = applyAlg(st, mv.join(' '));
    steps.push({ stage: 'Cross', title: `Daisy: white edge ${k + 1} of 4`, moves: mv.join(' '), say: 'Bring a white edge up next to the yellow centre, white facing up.' });
  }
  // Match and drop.
  const faceOf = { F: 7, R: 5, B: 1, L: 3 }; // U-sticker index of each U edge
  for (let n = 0; n < 4; n++) {
    let done = false;
    for (const a of AUFS) {
      const s2 = applyAlg(st, a);
      for (const f of ['F', 'R', 'B', 'L']) {
        const uIdx = S('U', faceOf[f]);
        if (colourOf(s2[uIdx]) !== 'W') continue;
        if (colourOf(s2[S(f, 1)]) !== colourOf(s2[S(f, 4)])) continue;
        const mv = `${a} ${f}2`.trim();
        st = applyAlg(st, mv);
        steps.push({ stage: 'Cross', title: `Match and drop (${f})`, moves: mv, say: `Turn the top until the edge matches the ${({ F: 'front', R: 'right', B: 'back', L: 'left' })[f]} centre, then turn that face twice.` });
        done = true; break;
      }
      if (done) break;
    }
    if (!done) throw new Error('match and drop failed');
  }
  if (!goals.cross(st)) throw new Error('cross not solved after daisy');
  return st;
}

// --- F2L: BFS over J Perm's moves -------------------------------------------
// A "lift" is a quarter turn that brings exactly one slot into the top layer.
// R and L lifts are what the one-pager teaches; F and B lifts are only used
// when R/L alone cannot reach the pair, and are then shown as "turn the cube
// (y), do the R/L insert, turn back". Which slot each lifts, and each
// rewrite, are derived from and checked against the engine.
const SLOT_HOMES = { FR: ['1,-1,1', '1,0,1'], FL: ['-1,-1,1', '-1,0,1'], BR: ['1,-1,-1', '1,0,-1'], BL: ['-1,-1,-1', '-1,0,-1'] };
function liftsOf(xs) {
  return xs.map((x) => {
    const c = apply(solved(), x);
    const lifted = Object.keys(SLOT_HOMES).filter((k) => SLOT_HOMES[k].every((h) => c.find((q) => q.home.join() === h).pos[1] === 1));
    if (lifted.length !== 1) throw new Error(`${x} lifts ${lifted.length} slots`);
    return { x, slot: lifted[0] };
  });
}
const LIFTS = liftsOf(['R', "R'", 'L', "L'"]);
const ALL_LIFTS = liftsOf(['R', "R'", 'L', "L'", 'F', "F'", 'B', "B'"]);
if (new Set(LIFTS.map((l) => l.slot)).size !== 4) throw new Error('expected one R/L lift per slot');

// F/B conjugate -> rotation + R/L conjugate, proven equal by the engine.
const sameState = (a, b) => stateString(apply(solved(), a)) === stateString(apply(solved(), b));
function humanise(alg) {
  const [x, u] = alg.split(' ');
  if ('RL'.includes(x[0])) return { alg, rotated: null };
  for (const r of ['y', "y'", 'y2']) for (const x2 of ['R', "R'", 'L', "L'"]) {
    const rInv = r === 'y2' ? 'y2' : r.endsWith("'") ? 'y' : "y'";
    const cand = `${r} ${x2} ${u} ${inv(x2)} ${rInv}`;
    if (sameState(alg, cand)) return { alg: cand, rotated: r };
  }
  throw new Error('no R/L form for ' + alg);
}
const inv = (m) => (m.endsWith("'") ? m[0] : m + "'");

function macrosFor(target, solvedSlots, lifts) {
  const list = AUFS.slice(1).map((u) => ({ alg: u, kind: 'U' }));
  for (const { x, slot } of lifts) {
    if (solvedSlots.includes(slot)) continue; // never break a solved slot
    for (const u of AUFS.slice(1)) list.push({ alg: `${x} ${u} ${inv(x)}`, kind: 'slot', slot, target: slot === target });
  }
  return list;
}

function pairSolution(st, target, solvedSlots, lifts = LIFTS) {
  const labels = SLOTS[target].idx;
  const key = (s) => labels.map((l) => s.indexOf(l)).join(',');
  const goal = goals.slot(target);
  if (goal(st)) return [];
  const macros = macrosFor(target, solvedSlots, lifts);
  const seen = new Map([[key(st), null]]);
  let frontier = [st];
  while (frontier.length) {
    const next = [];
    for (const s of frontier) {
      for (const m of macros) {
        const t = applyAlg(s, m.alg);
        const k = key(t);
        if (seen.has(k)) continue;
        seen.set(k, { from: key(s), m });
        if (goal(t)) {
          const path = [];
          for (let kk = k; seen.get(kk); kk = seen.get(kk).from) path.unshift(seen.get(kk).m);
          return path;
        }
        next.push(t);
      }
    }
    frontier = next;
  }
  if (lifts === LIFTS) return pairSolution(st, target, solvedSlots, ALL_LIFTS); // R/L alone can't: allow F/B
  throw new Error('F2L pair unreachable: ' + target);
}

function solveF2L(st, steps) {
  const solvedSlots = Object.keys(SLOTS).filter((k) => goals.slot(k)(st));
  while (solvedSlots.length < 4) {
    // Easiest pair first (fewest macros, then fewest moves), slot order breaks ties.
    let best = null;
    for (const k of Object.keys(SLOTS)) {
      if (solvedSlots.includes(k)) continue;
      const p = pairSolution(st, k, solvedSlots);
      const len = p.reduce((n, m) => n + parse(m.alg).length, 0);
      if (!best || p.length < best.p.length || (p.length === best.p.length && len < best.len)) best = { k, p, len };
    }
    const name = SLOTS[best.k].name;
    best.p.forEach((m, i) => {
      const last = i === best.p.length - 1;
      const h = m.kind === 'U' ? { alg: m.alg, rotated: null } : humanise(m.alg);
      let say = m.kind === 'U' ? 'Turn the top.'
        : last ? `Insert the pair into the ${name} slot.`
        : m.target ? 'Turn the face away, move the top, turn it back.'
        : `Take the piece out using the ${SLOTS[m.slot].name} slot (it is not solved yet, so nothing breaks).`;
      if (h.rotated) say = `Turn the whole cube (${h.rotated}) so the slot is at your side, then: ${say.charAt(0).toLowerCase() + say.slice(1)} Turn the cube back.`;
      steps.push({ stage: 'F2L', title: `Pair ${4 - (3 - solvedSlots.length)} of 4 (${name})`, moves: h.alg, say });
    });
    st = best.p.reduce((s, m) => applyAlg(s, m.alg), st);
    if (!goals.slot(best.k)(st) || !goals.cross(st)) throw new Error('F2L step broke something');
    solvedSlots.push(best.k);
  }
  return st;
}

// --- last layer: recognise Ben's case by trying his algorithms --------------
const byId = Object.fromEntries(CASES.map((c) => [c.id, c]));
const LL_STEPS = [
  { stage: 'OLL', title: 'Yellow cross', goal: 'oll1', cases: ['oll-minus', 'oll-l'], fallback: 'oll-minus' },
  { stage: 'OLL', title: 'Yellow corners', goal: 'oll2', cases: ['oll-double-headlight', 'oll-headlight-blink', 'oll-bowtie', 'oll-chameleon-headlight', 'oll-chameleon-blink', 'oll-sune', 'oll-antisune'] },
  { stage: 'PLL', title: 'Corners', goal: 'pll1', cases: ['pll-adj-corner', 'pll-diag-corner'] },
  { stage: 'PLL', title: 'Edges', goal: 'pll2', cases: ['pll-opp-edge', 'pll-adj-edge', 'pll-3edge-rl', 'pll-3edge-lr'] },
];

export function recognise(st, step) {
  for (const id of step.cases) for (const a of AUFS) {
    if (goals[step.goal](applyAlg(st, `${a} ${byId[id].moves}`))) return { id, auf: a };
  }
  return null;
}

function solveLL(st, steps) {
  for (const step of LL_STEPS) {
    for (let tries = 0; !goals[step.goal](st); tries++) {
      if (tries > 2) throw new Error(`${step.stage} ${step.title}: no case found`);
      let hit = recognise(st, step);
      let dot = false;
      if (!hit && step.fallback) { hit = { id: step.fallback, auf: '' }; dot = true; }
      if (!hit) throw new Error(`${step.stage} ${step.title}: no case found`);
      const k = byId[hit.id];
      if (hit.auf) { st = applyAlg(st, hit.auf); steps.push({ stage: step.stage, title: `${step.title}: hold it`, moves: hit.auf, say: `Turn the top so: ${k.hold_text}.`, case: k.id }); }
      st = applyAlg(st, k.moves);
      steps.push({ stage: step.stage, title: `${step.title}: ${dot ? 'Dot, so ' : ''}${k.name}`, moves: k.moves, say: dot ? 'No yellow edges (dot): do Minus first, you get an L.' : k.cue || k.hold_text, case: k.id });
    }
  }
  for (const a of AUFS) if (goals.solved(applyAlg(st, a))) { if (a) { st = applyAlg(st, a); steps.push({ stage: 'PLL', title: 'Line up the top', moves: a, say: 'Turn the top to match the centres. Solved!' }); } break; }
  if (!goals.solved(st)) throw new Error('not solved at the end');
  return st;
}

// Entry point: a cube (engine model) -> steps. The cube is first turned to
// yellow up / green front, as the tutorial holds it.
export function solve(cube) {
  const steps = [];
  let st = fromCube(normalize(clone(cube)));
  st = solveCross(st, steps);
  st = solveF2L(st, steps);
  st = solveLL(st, steps);
  return steps;
}

export function solveScramble(scramble) {
  return solve(apply(solved(), scramble));
}

export { LIFTS, LL_STEPS };
