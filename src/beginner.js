// Beginner method content (J Perm, "Learn How to Solve a Rubik's Cube in 10
// Minutes", 7Ron6MN45LY). Separate from cases.js so the signed-off CFOP sheet
// never changes. Read by scripts/build-beginner.js, video/case.html?set=beginner
// and scripts/verify-beginner.js.
//
// hold: whole-cube turn from yellow-up/green-front before the case starts
// ('z2' = upside down, green still in front). moves: the whole path from the
// pictured start to a clean finish ("·" splits phases; the engine ignores it).
// side: 'left' puts the camera and picture on the left. focus: which pieces
// stay coloured. expect: what verify-beginner.js asserts on the start state.
// alg: what the card prints when the video shows a longer path (dot, L).
import { solved, apply, invert, parse, fmt } from './cube.js';

export const B_SHORTHAND = { sexy: "R U R' U'", 'left sexy': "L' U' L U" };

export const B_STAGES = [
  { id: 'b-cross', n: 1, title: 'White cross', hold: 'White on top', sub: 'edges only; side colours match their centres',
    steps: [
      'Find a white edge on the bottom layer (two colours, not a corner).',
      'Turn the bottom until the edge sits under the centre of its other colour, then turn that face twice.',
      'Edge in the middle layer: turn that side once to drop it to the bottom, turn the bottom to move it away, then turn that side back so your cross is fixed again. Then as above.',
      'Check: a white cross on top, and each edge\'s side colour matches the centre below it.',
    ] },
  { id: 'b-corners', n: 2, title: 'White corners', hold: 'Turn it upside down: white on the bottom, same face towards you', sub: 'corner above its slot, then sexy until it drops in',
    steps: [
      'Find a top corner with white. Its other two colours say where it goes: turn the top until it sits right above that spot.',
      'Right side: sexy, again and again until the corner is in (never more than 5). Left side: left sexy.',
      'Corner stuck in the bottom, wrong way round: do sexy once to bring it up, then as above.',
    ] },
  { id: 'b-middle', n: 3, title: 'Middle layer', hold: 'Yellow on top', sub: 'top edge with no yellow; match its front colour to the centre',
    steps: [
      'Turn the top until the edge\'s front colour matches the centre below it. Its top colour says left or right.',
      'Going right: top away to the left (U), sexy. Turn the whole cube so the right side faces you (y), left sexy, turn it back. Going left: the mirror.',
      'Edge stuck in the middle, wrong way round: put any top edge into its place to pop it out.',
    ] },
  { id: 'b-ycross', n: 4, title: 'Yellow cross', hold: 'Yellow on top', sub: 'edges only; corners ignored (grey)',
    steps: ['F · sexy · F\' each time. Dot gives an L; L (held at the back-left) gives a line; line (held left to right) gives the cross.'] },
  { id: 'b-yedges', n: 5, title: 'Yellow edges', hold: 'Yellow on top', sub: 'side colours of the yellow edges',
    steps: [
      'Turn the top to line up as many edge colours as you can. All four: done.',
      'Two next to each other: hold them at the back and the right, do the algorithm, line up.',
      'Two opposite: do it once from anywhere, line up, then you have the case above.',
    ] },
  { id: 'b-ycorners', n: 6, title: 'Yellow corners in place', hold: 'Yellow on top', sub: 'right spot only; twisted is fine for now',
    steps: [
      'A corner is in the right spot when its three colours match the three centres around it.',
      'Hold the one right corner at the front-right and do the algorithm (once or twice). None right: do it once from anywhere first.',
    ] },
  { id: 'b-twist', n: 7, title: 'Twist the corners', hold: 'Turn it upside down: yellow on the bottom, same face towards you', sub: 'one corner at a time, at the bottom front-right',
    steps: [
      'Sexy again and again until that corner shows yellow on the bottom (2 or 4 times). The rest looks broken: keep going.',
      'Turn only the bottom layer (D) to bring the next twisted corner to the front-right. Never turn the whole cube.',
      'When all four are done, turn the bottom to line it up. Solved!',
    ] },
];

const sexy = "R U R' U'";
export const B_CASES = [
  // 1 · White cross (white on top)
  { id: 'b-cross-drop', stage: 'b-cross', hold: 'z2', name: 'Edge on the bottom', hold_text: 'Green sticker on the bottom row, white hidden underneath; turn the bottom until green is under the green centre', cue: 'bottom until it matches · face twice', moves: "D' · F2", focus: 'cross', expect: { kind: 'cross-edge-bottom' } },
  { id: 'b-cross-flip', stage: 'b-cross', hold: 'z2', name: 'Edge on top, flipped', hold_text: 'White edge in the top front, white facing you', cue: 'F out to the side · top back · R up · top again', moves: "F U' R U", focus: 'cross', expect: { kind: 'cross-edge-flipped' } },

  // 2 · White corners (white on the bottom)
  { id: 'b-corner-right', stage: 'b-corners', name: 'White facing right', hold_text: 'Corner above its slot at the front-right', cue: 'sexy once', moves: sexy, focus: 'corner', expect: { kind: 'corner', white: 'R', sexies: 1 } },
  { id: 'b-corner-up', stage: 'b-corners', name: 'White facing up', hold_text: 'Corner above its slot at the front-right', cue: 'sexy 3 times', moves: `(${sexy})3`, focus: 'corner', expect: { kind: 'corner', white: 'U', sexies: 3 } },
  { id: 'b-corner-front', stage: 'b-corners', name: 'White facing you', hold_text: 'Corner above its slot at the front-right', cue: 'sexy 5 times', moves: `(${sexy})5`, focus: 'corner', expect: { kind: 'corner', white: 'F', sexies: 5 } },
  { id: 'b-corner-left', stage: 'b-corners', side: 'left', name: 'Left side: white facing left', hold_text: 'Corner above its slot at the front-left', cue: 'left sexy once (the mirror: 3 for up, 5 for facing you)', moves: "L' U' L U", focus: 'corner', expect: { kind: 'corner', white: 'L', sexies: 1, left: true } },

  // 3 · Middle layer (yellow on top)
  { id: 'b-mid-right', stage: 'b-middle', name: 'Edge goes right', hold_text: 'Front colour matches the centre; top colour is the right centre', cue: 'U away · sexy · turn the cube (right side to you) · left sexy · turn back', moves: "U · R U R' U' · y · L' U' L U · y'", focus: 'middle', expect: { kind: 'middle', to: 'R' } },
  { id: 'b-mid-left', stage: 'b-middle', side: 'left', name: 'Edge goes left', hold_text: 'Front colour matches the centre; top colour is the left centre', cue: "U' away · left sexy · turn the cube (left side to you) · sexy · turn back", moves: "U' · L' U' L U · y' · R U R' U' · y", focus: 'middle', expect: { kind: 'middle', to: 'L' } },

  // 4 · Yellow cross
  { id: 'b-ycross-dot', stage: 'b-ycross', name: 'Dot', hold_text: 'No yellow edges up', alg: "F R U R' U' F'", cue: 'you get an L: turn the top to put it at the back-left, next card', moves: "F R U R' U' F' · U2 · F R U R' U' F' · F R U R' U' F'", focus: 'yedges', expect: { kind: 'ycross', shape: 'dot', passes: 3 } },

  { id: 'b-ycross-l', stage: 'b-ycross', name: 'L', hold_text: 'L at the back and the left', alg: "F R U R' U' F'", cue: 'you get a line: next card', moves: "F R U R' U' F' · F R U R' U' F'", focus: 'yedges', expect: { kind: 'ycross', shape: 'L', passes: 2 } },
  { id: 'b-ycross-line', stage: 'b-ycross', name: 'Line', hold_text: 'Line left to right', cue: 'you get the yellow cross', moves: "F R U R' U' F'", focus: 'yedges', expect: { kind: 'ycross', shape: 'line', passes: 1 } },
  // 5 · Yellow edges
  { id: 'b-yedges', stage: 'b-yedges', name: 'Two next to each other', hold_text: 'Matched edges at the back and the right', cue: 'then turn the top to line them all up', moves: "R U R' U R U2 R' · U", focus: 'yedges-side', expect: { kind: 'yedges' } },

  // 6 · Yellow corners in place
  { id: 'b-ycorners', stage: 'b-ycorners', name: 'One corner right', hold_text: 'The right corner at the front-right', cue: 'keep that corner at the front-right; repeat if needed', moves: "U R U' L' U R' U' L", focus: 'ycorners', expect: { kind: 'ycorners' } },

  // 7 · Twist the corners (yellow on the bottom)
  { id: 'b-twist', stage: 'b-twist', hold: 'z2', name: 'Two corners to twist', hold_text: 'Yellow on the bottom; twisted corner at the bottom front-right', cue: 'sexy ×2 · D · sexy ×4 · D\'', moves: `(${sexy})2 · D · (${sexy})4 · D'`, focus: 'all', expect: { kind: 'twist' } },
];

// The start state everyone draws, animates and checks: no normalize, which
// would undo the hold.
export function bStart(k, moves = k.moves) {
  return apply(apply(solved(), k.hold || ''), invert(fmt(parse(moves))));
}

// Which stickers stay coloured (by each piece's home, so it holds for the
// whole animation, whatever the hold). Shared by the sheet and the videos.
export function bFocus(k) {
  const centre = (q) => q.home.filter((v) => v === 0).length === 2;
  const edge = (q) => q.home.filter((v) => v === 0).length === 1;
  const f2l = (q) => q.home[1] < 1;
  const rule = {
    cross: (q) => edge(q) && q.home[1] === -1,
    corner: (q) => q.home[1] === -1,
    middle: f2l,
    yedges: (q, s) => f2l(q) || (edge(q) && s.c === 'Y'),
    'yedges-side': (q) => f2l(q) || edge(q),
  }[k.focus] || (() => true);
  return (q, s) => centre(q) || rule(q, s);
}
