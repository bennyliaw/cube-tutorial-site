// Helpers for verify.js and the builders: what an algorithm does to a solved
// cube, and what a case picture looks like.
import { fromAlg, apply, clone, facelets, normalize, invert, solved } from '../src/cube.js';

const LAYER2 = [3, 4, 5, 6, 7, 8];
export function f2lIntact(f) {
  return f.D.every((c) => c === 'W') && ['F', 'R', 'B', 'L'].every((s) => LAYER2.every((i) => f[s][i] === f[s][4]));
}
// Cross + three of four slots intact (used for the F2L inserts, which by
// design disturb exactly one slot).
export function slotsIntact(f) {
  const cross = [1, 3, 5, 7].every((i) => f.D[i] === 'W') && ['F', 'R', 'B', 'L'].every((s) => f[s][7] === f[s][4]);
  const slot = { FR: [f.F[5], f.F[8], f.R[3], f.R[6], f.D[2]], FL: [f.F[3], f.F[6], f.L[5], f.L[8], f.D[0]], BR: [f.B[3], f.B[6], f.R[5], f.R[8], f.D[8]], BL: [f.B[5], f.B[8], f.L[3], f.L[6], f.D[6]] };
  const centre = { F: f.F[4], R: f.R[4], B: f.B[4], L: f.L[4] };
  const ok = (k) => slot[k].every((c, i) => c === (i === 4 ? 'W' : centre[k[i < 2 ? 0 : 1]]));
  return { cross, broken: Object.keys(slot).filter((k) => !ok(k)) };
}

const Y = 'Y';
export function picture(f) {
  const up = { UFL: f.U[6] === Y, UFR: f.U[8] === Y, UBR: f.U[2] === Y, UBL: f.U[0] === Y };
  const side = { // yellow corner stickers on each side's top row
    F: [f.F[0], f.F[2]].map((c) => c === Y), R: [f.R[0], f.R[2]].map((c) => c === Y),
    B: [f.B[0], f.B[2]].map((c) => c === Y), L: [f.L[0], f.L[2]].map((c) => c === Y),
  };
  const headlights = Object.keys(side).filter((s) => side[s][0] && side[s][1]);
  const edgesUp = { B: f.U[1] === Y, L: f.U[3] === Y, R: f.U[5] === Y, F: f.U[7] === Y };
  return { up, side, headlights, edgesUp };
}

export function edgeShape(e) {
  const n = Object.values(e).filter(Boolean).length;
  if (n === 4) return 'cross';
  if (n === 0) return 'dot';
  if (n === 2) return (e.F && e.B) || (e.L && e.R) ? 'line' : 'L';
  return `${n}-edges?`;
}
export function edgeHold(e) {
  if (e.L && e.R) return 'line left-right';
  if (e.F && e.B) return 'line front-back';
  return 'L at ' + ['B', 'L', 'F', 'R'].filter((k) => e[k]).join('+');
}

export function cornerClass(p) {
  const ups = Object.entries(p.up).filter(([, v]) => v).map(([k]) => k);
  if (ups.length === 4) return 'solved';
  if (ups.length === 1) return 'Sune/Antisune';
  if (ups.length === 0) return p.headlights.length === 2 ? 'H' : p.headlights.length === 1 ? 'Pi' : '?';
  if (ups.length === 2) {
    const diag = (ups.includes('UFL') && ups.includes('UBR')) || (ups.includes('UFR') && ups.includes('UBL'));
    if (diag) return 'L';
    return p.headlights.length === 1 ? 'U' : 'T';
  }
  return '?';
}

// Last-layer permutation the algorithm causes, up to a final U turn (AUF).
const POS = { '-1,1,1': 'UFL', '1,1,1': 'UFR', '1,1,-1': 'UBR', '-1,1,-1': 'UBL', '0,1,1': 'UF', '1,1,0': 'UR', '0,1,-1': 'UB', '-1,1,0': 'UL' };
const ADJ = (a, b) => a.length === 3 ? a[1] === b[1] || a[2] === b[2] : !((a + b).includes('F') && (a + b).includes('B')) && !((a + b).includes('L') && (a + b).includes('R'));
export function pllEffect(alg) {
  let best = null;
  for (const auf of ['', 'U', 'U2', "U'"]) {
    const c = normalize(apply(fromAlg(alg), auf));
    const moved = c.filter((q) => q.home[1] === 1 && (q.home[0] || q.home[2]) && q.pos.join() !== q.home.join());
    if (!best || moved.length < best.moved.length) best = { auf, c, moved };
  }
  const map = Object.fromEntries(best.moved.map((q) => [POS[q.home.join()], POS[q.pos.join()]]));
  const cycles = [];
  const seen = new Set();
  for (const s of Object.keys(map)) {
    if (seen.has(s)) continue;
    const cyc = [];
    for (let x = s; !seen.has(x); x = map[x]) { seen.add(x); cyc.push(x); }
    cycles.push(cyc);
  }
  const corners = cycles.filter((c) => c[0].length === 3);
  const edges = cycles.filter((c) => c[0].length === 2);
  let cls = '?';
  if (corners.length === 1 && corners[0].length === 2) cls = ADJ(...corners[0]) ? 'adjacent corner swap' : 'diagonal corner swap';
  else if (!corners.length && edges.length === 2 && edges.every((e) => e.length === 2)) cls = edges.every((e) => !ADJ(...e)) ? 'opposite edge swap' : 'adjacent edge swap';
  else if (!corners.length && edges.length === 1 && edges[0].length === 3) cls = 'three edge';
  return { cls, auf: best.auf, map, cycles };
}

