// SVG diagrams drawn from the engine's sticker view. Works in Node and browser.
// topView: OLL/PLL picture (3x3 top + the 12 side stickers around it).
// isoView: 3-face view (U, F, R) for cross and F2L.
import { fromAlg, apply, facelets, normalize, invert, solved } from './cube.js';

export const PALETTE = {
  dark: { Y: '#FFD60A', W: '#F5F7FA', G: '#16C172', B: '#3A7BFF', O: '#FF8A1F', R: '#F0334B', dim: '#2A3350', line: '#0A0F1E', arrow: '#FFFFFF' },
  print: { Y: '#FFD000', W: '#FFFFFF', G: '#109A57', B: '#1F5FE0', O: '#F27A0F', R: '#D9233A', dim: '#D3D8E2', line: '#1A1F2B', arrow: '#111111' },
  // Beginner print sheet: light grey "don't care" stickers and grey outlines,
  // to save ink (Ben, 19 Oct); the outlines keep white stickers visible.
  printb: { Y: '#FFD000', W: '#FFFFFF', G: '#109A57', B: '#1F5FE0', O: '#F27A0F', R: '#D9233A', dim: '#E2E5EB', line: '#8F97A6', arrow: '#111111' },
};

// Case state: what the cube looks like before the algorithm (plus a final
// AUF so the algorithm then finishes the layer exactly).
export function caseFacelets(moves, auf = '') {
  return facelets(normalize(fromAlg(invert(`${moves} ${auf}`.trim()))));
}

export function caseCube(moves, auf = '') {
  return normalize(fromAlg(invert(`${moves} ${auf}`.trim())));
}

const POS2CELL = (pos) => [pos[0] + 1, pos[2] + 1]; // top view: col = x, row = z (back at top)

// mode: 'oll' greys everything except yellow; 'pll' shows real colours.
export function topView(f, { mode = 'pll', theme = 'dark', arrows = [], size = 120 } = {}) {
  const P = PALETTE[theme];
  const col = (c) => (mode.startsWith('oll') ? (c === 'Y' ? P.Y : P.dim) : P[c] || P.dim);
  // 'oll-edges': corners don't matter yet, so grey them out.
  if (mode === 'oll-edges') {
    f = { ...f, U: f.U.map((c, i) => ([0, 2, 6, 8].includes(i) ? 'x' : c)) };
    for (const s of ['F', 'R', 'B', 'L']) f[s] = f[s].map((c, i) => (i === 0 || i === 2 ? 'x' : c));
  }
  const s = size / 4.2; // cell
  const t = s * 0.36; // strip depth
  const g = s * 0.08; // gap
  const o = t + g * 2; // grid origin
  const W = o * 2 + s * 3;
  const r = s * 0.14;
  const out = [];
  const rect = (x, y, w, h, c) => out.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${r.toFixed(1)}" fill="${c}" stroke="${P.line}" stroke-width="${(s * 0.05).toFixed(2)}"/>`);
  for (let i = 0; i < 9; i++) rect(o + (i % 3) * s + g / 2, o + Math.floor(i / 3) * s + g / 2, s - g, s - g, col(f.U[i]));
  // Side strips, laid out as seen from above.
  const strips = {
    B: [f.B[2], f.B[1], f.B[0]], F: [f.F[0], f.F[1], f.F[2]],
    L: [f.L[0], f.L[1], f.L[2]], R: [f.R[2], f.R[1], f.R[0]],
  };
  strips.B.forEach((c, i) => rect(o + i * s + g, g, s - 2 * g, t, col(c)));
  strips.F.forEach((c, i) => rect(o + i * s + g, o + 3 * s + g, s - 2 * g, t, col(c)));
  strips.L.forEach((c, i) => rect(g, o + i * s + g, t, s - 2 * g, col(c)));
  strips.R.forEach((c, i) => rect(o + 3 * s + g, o + i * s + g, t, s - 2 * g, col(c)));
  for (const [a, b] of arrows) {
    const [ax, ay] = a.map((v) => o + v * s + s / 2);
    const [bx, by] = b.map((v) => o + v * s + s / 2);
    const len = Math.hypot(bx - ax, by - ay);
    const sh = s * 0.28;
    const [ux, uy] = [(bx - ax) / len, (by - ay) / len];
    const [x1, y1, x2, y2] = [ax + ux * sh, ay + uy * sh, bx - ux * sh, by - uy * sh];
    const hw = s * 0.16;
    out.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${(x2 - ux * hw).toFixed(1)}" y2="${(y2 - uy * hw).toFixed(1)}" stroke="${P.arrow}" stroke-width="${(s * 0.09).toFixed(2)}" stroke-linecap="round"/>`);
    out.push(`<polygon points="${x2.toFixed(1)},${y2.toFixed(1)} ${(x2 - ux * hw * 1.6 - uy * hw).toFixed(1)},${(y2 - uy * hw * 1.6 + ux * hw).toFixed(1)} ${(x2 - ux * hw * 1.6 + uy * hw).toFixed(1)},${(y2 - uy * hw * 1.6 - ux * hw).toFixed(1)}" fill="${P.arrow}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(1)} ${W.toFixed(1)}" width="${size}" height="${size}">${out.join('')}</svg>`;
}

// Arrows for a PLL case: each last-layer piece from where it is to where the
// algorithm sends it (its home). Swaps get one double-headed pair of arrows.
export function pllArrows(cube) {
  const arrows = [];
  for (const q of cube) {
    if (q.home[1] !== 1 || (!q.home[0] && !q.home[2])) continue;
    if (q.pos.join() === q.home.join()) continue;
    arrows.push([POS2CELL(q.pos), POS2CELL(q.home)]);
  }
  return arrows;
}

// Isometric 3-face view. keep(face, i, colour) -> false greys a sticker.
export function isoView(f, { theme = 'dark', size = 120, keep = () => true } = {}) {
  const P = PALETTE[theme];
  const s = size / 5.2;
  const cx = size / 2;
  const cy = size / 2;
  const c30 = Math.cos(Math.PI / 6);
  // Unit vectors on screen: x (right) goes down-right, z (front) goes down-left, y goes up.
  const X = [c30 * s, 0.5 * s];
  const Z = [-c30 * s, 0.5 * s];
  const Yv = [0, -s];
  const pt = (x, y, z) => [cx + X[0] * x + Z[0] * z + Yv[0] * y, cy + X[1] * x + Z[1] * z + Yv[1] * y];
  const out = [];
  const quad = (pts, c) => out.push(`<polygon points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="${c}" stroke="${P.line}" stroke-width="${(s * 0.07).toFixed(2)}" stroke-linejoin="round"/>`);
  const inset = 0.06;
  const colour = (face, i) => (keep(face, i, f[face][i]) ? P[f[face][i]] : P.dim);
  for (let i = 0; i < 9; i++) {
    const r = Math.floor(i / 3), c = i % 3;
    // U: row r goes back->front (z from -1.5), col c left->right (x from -1.5)
    let [x0, z0] = [-1.5 + c + inset, -1.5 + r + inset], [x1, z1] = [x0 + 1 - 2 * inset, z0 + 1 - 2 * inset];
    quad([pt(x0, 1.5, z0), pt(x1, 1.5, z0), pt(x1, 1.5, z1), pt(x0, 1.5, z1)], colour('U', i));
    // F: row r top->bottom, col c left->right, z = 1.5
    let [y0, y1] = [1.5 - r - inset, 0.5 - r + inset];
    [x0, x1] = [-1.5 + c + inset, -0.5 + c - inset];
    quad([pt(x0, y0, 1.5), pt(x1, y0, 1.5), pt(x1, y1, 1.5), pt(x0, y1, 1.5)], colour('F', i));
    // R: row r top->bottom, col c front->back, x = 1.5
    [z0, z1] = [1.5 - c - inset, 0.5 - c + inset];
    quad([pt(1.5, y0, z0), pt(1.5, y0, z1), pt(1.5, y1, z1), pt(1.5, y1, z0)], colour('R', i));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${out.join('')}</svg>`;
}

export { solved, apply, facelets };

// Which cubie (by home position) owns each sticker, per face: lets a picture
// highlight just the pieces that matter (e.g. one F2L pair).
import { slotOf, FACES } from './cube.js';
export function faceletHomes(cube) {
  const out = Object.fromEntries(FACES.map((f) => [f, Array(9)]));
  for (const q of cube) for (const s of q.stickers) { const [face, i] = slotOf(q.pos, s.n); out[face][i] = q.home.join(); }
  return out;
}

// Which stickers stay coloured for a case; the rest are greyed so the eye
// follows the pieces that matter. Fixed by each piece's home, so it holds for
// the whole animation. F2L: the pair + first-layer pieces already solved at the
// start. OLL and PLL: the first two layers (solved by then), plus in the top
// layer the yellow (OLL step 1: edges only) or every piece (PLL). Centres
// always. Shared by the one-pager, the case videos and the app.
export function f2lFocus(cube, left) {
  return new Set([left ? '-1,-1,1' : '1,-1,1', left ? '-1,0,1' : '1,0,1',
    ...cube.filter((q) => q.home[1] === -1 && q.pos.join() === q.home.join() && q.stickers.some((s) => s.c === 'W' && s.n[1] === -1)).map((q) => q.home.join())]);
}
export function caseFocus(k, start) {
  const centre = (q) => q.home.filter((v) => v === 0).length === 2;
  if (k.stage === 'f2l') { const set = f2lFocus(start, k.moves.startsWith('L')); return (q) => centre(q) || set.has(q.home.join()); }
  const f2l = (q) => q.home[1] < 1;
  if (k.stage === 'oll') { const edges = k.expect.kind === 'oll-edges'; return (q, s) => centre(q) || f2l(q) || (s.c === 'Y' && (!edges || q.home.filter((v) => v === 0).length === 1)); }
  return () => true;
}
