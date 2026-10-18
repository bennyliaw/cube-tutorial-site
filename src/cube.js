// Cube engine: 26 cubies with integer positions in {-1,0,1}^3, each carrying
// stickers (outward normal -> colour). Every move is "rotate the cubies in some
// layers by a quarter turn about one axis"; the 54-sticker view is derived.
// Axes: x = right, y = up, z = front (towards the viewer).
// Colour scheme (one definition): yellow up, green front => orange right.

export const SCHEME = { U: 'Y', D: 'W', F: 'G', B: 'B', R: 'O', L: 'R' };
export const NORMALS = {
  U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0],
};
const AXIS = { x: 0, y: 1, z: 2 };

// Move table: axis, layers turned, and sign of the quarter turn about +axis
// (right-hand rule: +1 is anticlockwise seen from the + end of the axis).
// A face turn is clockwise seen from that face; slices follow L (M), D (E), F (S).
const MOVES = {
  R: ['x', [1], -1], L: ['x', [-1], 1], M: ['x', [0], 1],
  U: ['y', [1], -1], D: ['y', [-1], 1], E: ['y', [0], 1],
  F: ['z', [1], -1], B: ['z', [-1], 1], S: ['z', [0], -1],
  r: ['x', [0, 1], -1], l: ['x', [-1, 0], 1],
  u: ['y', [0, 1], -1], d: ['y', [-1, 0], 1],
  f: ['z', [0, 1], -1], b: ['z', [-1, 0], 1],
  x: ['x', [-1, 0, 1], -1], y: ['y', [-1, 0, 1], -1], z: ['z', [-1, 0, 1], -1],
};

// Quarter turn of a vector about an axis, sign s = +1 or -1.
export function rot([x, y, z], axis, s) {
  if (axis === 'x') return [x, -s * z, s * y];
  if (axis === 'y') return [s * z, y, -s * x];
  return [-s * y, s * x, z];
}

const key = (v) => v.join(',');

export function solved() {
  const cubies = [];
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        if (!x && !y && !z) continue;
        const pos = [x, y, z];
        const stickers = [];
        for (const [face, n] of Object.entries(NORMALS))
          if (n.some((c, i) => c !== 0 && c === pos[i])) stickers.push({ n: [...n], c: SCHEME[face] });
        cubies.push({ id: cubies.length, home: [...pos], pos, stickers });
      }
  return cubies;
}

export function clone(cube) {
  return cube.map((q) => ({ ...q, home: [...q.home], pos: [...q.pos], stickers: q.stickers.map((s) => ({ n: [...s.n], c: s.c })) }));
}

// Parse "R U R' U' (M2 U)2 Rw x'" into [{m, turns}] with turns in {1,2,3}.
// Wide moves may be written Rw or r; "fat f" in Ben's notes is f.
export function parse(alg) {
  const out = [];
  const src = alg.replace(/[’`]/g, "'");
  const re = /\(([^()]*)\)(\d*)('?)|([RLUDFBMESxyzrludfb])(w?)(\d*)('?)/g;
  let m;
  while ((m = re.exec(src))) {
    if (m[1] !== undefined) {
      let inner = parse(m[1]);
      if (m[3]) inner = invertMoves(inner);
      const n = m[2] ? +m[2] : 1;
      for (let i = 0; i < n; i++) out.push(...inner);
      continue;
    }
    let face = m[4];
    if (m[5]) face = face.toLowerCase();
    let t = (m[6] ? +m[6] : 1) % 4;
    if (m[7]) t = (4 - t) % 4;
    if (t) out.push({ m: face, turns: t });
  }
  return out;
}

export function invertMoves(moves) {
  return moves.slice().reverse().map(({ m, turns }) => ({ m, turns: (4 - turns) % 4 }));
}

export const fmt = (moves) =>
  moves.map(({ m, turns }) => m + (turns === 2 ? '2' : turns === 3 ? "'" : '')).join(' ');

export function invert(alg) {
  return fmt(invertMoves(parse(alg)));
}

// Which cubies a move selects, and the axis/sign of one quarter turn.
export function moveSpec(m) {
  const spec = MOVES[m];
  if (!spec) throw new Error('unknown move ' + m);
  const [axis, layers, sign] = spec;
  return { axis, layers, sign };
}

export function applyMove(cube, { m, turns }) {
  const { axis, layers, sign } = moveSpec(m);
  const a = AXIS[axis];
  for (const q of cube) {
    if (!layers.includes(q.pos[a])) continue;
    for (let i = 0; i < turns; i++) {
      q.pos = rot(q.pos, axis, sign);
      for (const s of q.stickers) s.n = rot(s.n, axis, sign);
    }
  }
  return cube;
}

export function apply(cube, alg) {
  const moves = typeof alg === 'string' ? parse(alg) : alg;
  for (const mv of moves) applyMove(cube, mv);
  return cube;
}

export const fromAlg = (alg) => apply(solved(), alg);

// --- Derived sticker view -------------------------------------------------
// Each face is read row by row as seen from outside the cube, with this
// orientation: U has B at the top, D has F at the top, side faces have U at
// the top. Order of faces: U R F D L B (Kociemba).
export const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
const GRID = {
  // [row coordinate (axis, from), col coordinate (axis, from)]
  U: [[2, -1], [0, -1]], D: [[2, 1], [0, -1]],
  F: [[1, 1], [0, -1]], B: [[1, 1], [0, 1]],
  R: [[1, 1], [2, 1]], L: [[1, 1], [2, -1]],
};

// Sticker position on face, as [face, index 0..8].
export function slotOf(pos, n) {
  const face = Object.keys(NORMALS).find((f) => key(NORMALS[f]) === key(n));
  const [[ra, rf], [ca, cf]] = GRID[face];
  const row = rf === 1 ? 1 - pos[ra] : pos[ra] + 1;
  const col = cf === 1 ? 1 - pos[ca] : pos[ca] + 1;
  return [face, row * 3 + col];
}

export function facelets(cube) {
  const out = Object.fromEntries(FACES.map((f) => [f, Array(9).fill('?')]));
  for (const f of FACES) out[f][4] = null;
  for (const q of cube)
    for (const s of q.stickers) {
      const [face, i] = slotOf(q.pos, s.n);
      out[face][i] = s.c;
    }
  // Centres are cubies too; slotOf already filled index 4 for them.
  return out;
}

export function stateString(cube) {
  const f = facelets(cube);
  return FACES.map((x) => f[x].join('')).join('');
}

export const isSolved = (cube) => Object.values(facelets(cube)).every((a) => a.every((c) => c === a[4]));

// Whole-cube rotations that bring a state back to yellow-up, green-front.
const ROTS = (() => {
  const list = [];
  for (const a of ['', 'x', 'x2', "x'", 'z', "z'"]) for (const b of ['', 'y', 'y2', "y'"]) list.push(`${a} ${b}`.trim());
  return list;
})();

export function normalize(cube) {
  for (const r of ROTS) {
    const c = apply(clone(cube), r);
    const f = facelets(c);
    if (f.U[4] === SCHEME.U && f.F[4] === SCHEME.F) return c;
  }
  throw new Error('no orientation found');
}
