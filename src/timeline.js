// Frame -> cube state, shared by the case videos and the live app.
// segments: [{ moves: 'R U R\'', pauseAfter: frames, ...anything }]. Every move
// gets [from, to) frames; at(n) gives the cube, the in-progress turn and where
// we are, so playback, stepping and scrubbing all agree.
import { apply, clone, parse } from './cube.js';

export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const durOf = (mv, speed) => Math.round(('xyz'.includes(mv.m) ? 16 : mv.turns === 2 ? 16 : 11) * speed);

export function buildTimeline(start, segments, { intro = 0, gap = 4, outro = 0, moveSpeed = 1 } = {}) {
  const steps = []; // one per move
  const states = [clone(start)];
  const segs = [];
  let f = intro;
  segments.forEach((seg, si) => {
    const mvs = parse(seg.moves || '');
    const s0 = f, firstMove = steps.length;
    for (const mv of mvs) {
      const d = durOf(mv, moveSpeed);
      steps.push({ mv, from: f, to: f + d, seg: si });
      f += d + gap;
      states.push(apply(clone(states.at(-1)), [mv]));
    }
    segs.push({ ...seg, from: s0, to: f, firstMove, lastMove: steps.length });
    f += seg.pauseAfter || 0;
  });
  const total = f + outro;

  function at(n) {
    let i = steps.findIndex((s) => n < s.to);
    if (i === -1) i = steps.length;
    let turn = null;
    if (i < steps.length && n >= steps[i].from) {
      const s = steps[i];
      const q = s.mv.turns === 3 ? -1 : s.mv.turns;
      turn = { m: s.mv.m, angle: (Math.PI / 2) * q * ease((n - s.from) / (s.to - s.from)) };
    }
    let seg = segs.findIndex((s) => n < s.to + (s.pauseAfter || 0));
    if (seg === -1) seg = segs.length - 1;
    return { cube: states[i], turn, move: i, seg };
  }
  return { steps, states, segs, total, at };
}
