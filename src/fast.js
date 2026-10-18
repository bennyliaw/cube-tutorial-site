// Fast sticker model for search. Tables are DERIVED from the cubie engine
// (apply each move to a cube whose 54 stickers carry unique labels), never
// hand-written; test/fast.test.js checks they agree with the engine.
// A state is a Uint8Array(54): state[slot] = label of the sticker in that slot.
// Slot numbering: face order U R F D L B, 9 per face, as in cube.js facelets().
import { solved, applyMove, parse, FACES, slotOf } from './cube.js';

const slotIndex = (pos, n) => { const [face, i] = slotOf(pos, n); return FACES.indexOf(face) * 9 + i; };

function labelled() {
  const c = solved();
  for (const q of c) for (const s of q.stickers) s.label = slotIndex(q.pos, s.n);
  return c;
}

const cache = new Map();
// perm[to] = from: after the move, slot `to` holds what was in slot `from`.
export function movePerm(token) {
  if (cache.has(token)) return cache.get(token);
  const c = labelled();
  for (const mv of parse(token)) applyMove(c, mv);
  const perm = new Uint8Array(54);
  for (const q of c) for (const s of q.stickers) perm[slotIndex(q.pos, s.n)] = s.label;
  cache.set(token, perm);
  return perm;
}

export const SOLVED = Uint8Array.from({ length: 54 }, (_, i) => i);

export function applyPerm(state, perm) {
  const out = new Uint8Array(54);
  for (let i = 0; i < 54; i++) out[i] = state[perm[i]];
  return out;
}

export function applyAlg(state, alg) {
  for (const mv of parse(alg)) state = applyPerm(state, movePerm(mv.m + (mv.turns === 2 ? '2' : mv.turns === 3 ? "'" : '')));
  return state;
}

// Compose an algorithm into one permutation (for macros).
export function algPerm(alg) {
  return applyAlg(SOLVED, alg);
}

// Labels -> colours: label L sits on face floor(L/9) when solved.
const SCHEME_BY_FACE = { U: 'Y', R: 'O', F: 'G', D: 'W', L: 'R', B: 'B' };
export const colourOf = (label) => SCHEME_BY_FACE[FACES[Math.floor(label / 9)]];

// Cubie cube -> labelled state (for solving a cube held in the engine model).
export function fromCube(cube) {
  // Identify each sticker by where it lives when solved: the cubie's home and
  // the sticker's home normal. Track it via the cubie's current orientation.
  const ref = solved();
  const homeLabel = new Map();
  for (const q of ref) for (const s of q.stickers) homeLabel.set(q.home.join() + '|' + s.c, slotIndex(q.pos, s.n));
  const st = new Uint8Array(54);
  for (const q of cube) for (const s of q.stickers) st[slotIndex(q.pos, s.n)] = homeLabel.get(q.home.join() + '|' + s.c);
  return st;
}
