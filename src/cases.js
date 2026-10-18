// The one content file. One-pager, MP4s and app all read this.
// ben_text: Ben's words, verbatim from notes/joplin-rubik-2026-10-17.md.
// translation: exact (Ben wrote the moves) | interpreted (from Ben's prose,
// engine-checked) | standard (not in Ben's notes).
// expect: what scripts/verify.js must find. hold: cue asserted on the picture.

export const SHORTHAND = {
  sexy: "R U R' U'",
  sledgehammer: "R' F R F'",
  'fat f': 'f (front two layers)',
  'fat sexy': "r U R' U'",
};

export const STAGES = [
  {
    id: 'cross', title: 'Cross', source: 'standard',
    intro: 'White cross on the bottom, edges matching their centres. Basic method; advanced cross planning comes later.',
    steps: [
      { title: 'Daisy', text: 'Bring the 4 white edges up around the yellow centre, white facing up. Turn U out of the way before moving an edge up so you do not knock one off.' },
      { title: 'Match and drop', text: 'Turn U until a daisy edge\'s side colour matches the centre below it, then turn that face twice (F2 / R2 / B2 / L2). Repeat for all 4.' },
      { title: 'Next step up: direct cross', text: 'Skip the daisy: build the white cross straight on the bottom, each edge matched to its centre as you place it. Fewer moves, closer to real CFOP.' },
      { title: 'Check', text: 'Flip to look at the bottom: a white plus, and each edge\'s side colour matches its centre.' },
    ],
  },
  {
    id: 'f2l', title: 'F2L (first two layers)', source: 'jperm',
    intro: 'Pair each white corner with its edge in the top layer, then insert the pair. Four pairs. Cross stays on the bottom.',
    steps: [
      { title: 'Order', text: 'Both pieces into the top layer, look where the white sticker faces, pair them, insert. Never break a slot you have already solved. Examples go into the front-right slot; the left side is the mirror.' },
      { title: 'Finger rule', text: 'Index finger on top, parallel to the white sticker: the two edges it touches are where the edge can go (together or apart).' },
    ],
  },
];

export const CASES = [
  // --- F2L basic inserts (J Perm) ---
  { id: 'f2l-ins-r-joined', cue: "slot up \u00b7 pair over \u00b7 slot down", hold_text: "Joined pair at the front-left of the top, white facing left; goes into the front-right slot", stage: 'f2l', name: 'Insert right, joined pair', moves: "R U' R'", translation: 'standard', source: 'jperm', expect: { kind: 'f2l-insert' } },
  { id: 'f2l-ins-l-joined', cue: "mirror of the right-hand insert", hold_text: "Joined pair at the front-right of the top, white facing right; goes into the front-left slot", stage: 'f2l', name: 'Insert left, joined pair', moves: "L' U L", translation: 'standard', source: 'jperm', expect: { kind: 'f2l-insert' } },
  { id: 'f2l-ins-r-split', cue: "slot up \u00b7 corner over \u00b7 slot down", hold_text: "Corner above the front-right slot, white facing right; edge at the back; top colours don't match", stage: 'f2l', name: 'Insert right, split pair', moves: "R U R'", translation: 'standard', source: 'jperm', expect: { kind: 'f2l-insert' } },
  { id: 'f2l-ins-l-split', cue: "mirror of the right-hand insert", hold_text: "Corner above the front-left slot, white facing left; edge at the back; top colours don't match", stage: 'f2l', name: 'Insert left, split pair', moves: "L' U' L", translation: 'standard', source: 'jperm', expect: { kind: 'f2l-insert' } },

  // --- F2L rules (J Perm), one worked example each into the front-right slot.
  // "·" splits the phases; the engine ignores it. Each was traced phase by phase.
  { id: 'f2l-stuck', cue: "Lift it out with an insert move. Here that leaves a joined pair: U, insert.", hold_text: "Corner in its slot, white facing front; edge on the right of the top", stage: 'f2l', name: 'Piece stuck in a slot', moves: "R U' R' · U · R U' R'", translation: 'standard', source: 'jperm', expect: { kind: 'f2l-insert' } },
  { id: 'f2l-together', cue: "U' (white still showing). Match, so together: R away, U edge next to it, R' back. U2, insert.", hold_text: "Corner over its slot, white facing front; edge at the back; top colours match", stage: 'f2l', name: 'White on the side, colours match', moves: "U' · R U R' · U2 · R U' R'", translation: 'standard', source: 'jperm', expect: { kind: 'f2l-insert' } },
  { id: 'f2l-apart', cue: "U (white still showing). No match, so apart: F' away, U edge to the far side, F back. U', insert.", hold_text: "Corner over its slot, white facing right; edge on the left; top colours don't match", stage: 'f2l', name: "White on the side, colours don't match", moves: "U · F' U F · U' · R U R'", translation: 'standard', source: 'jperm', expect: { kind: 'f2l-insert' } },
  { id: 'f2l-white-up', cue: "U until the edge matches its centre. R away (edge to the back), U2 corner on top of it, R' back. U, insert.", hold_text: "Corner over its slot, white facing up; edge at the back", stage: 'f2l', name: 'White facing up', moves: "U · R U2 R' · U · R U' R'", translation: 'standard', source: 'jperm', expect: { kind: 'f2l-insert' } },
  { id: 'f2l-special', cue: "The white-up rule goes round in a circle. Split with R U2 R' (now apart), U', insert.", hold_text: "Corner over its slot, white facing up; edge next to it on the right", stage: 'f2l', name: 'Special case: split first', moves: "R U2 R' · U' · R U R'", translation: 'standard', source: 'jperm', expect: { kind: 'f2l-insert' } },

  // --- OLL edges (Ben 1-2) ---
  { id: 'oll-minus', cue: "F · sexy · F'", hold_text: "Line left to right", stage: 'oll', name: 'Minus', ben_text: "Minus: F sexy move F'", moves: "F R U R' U' F'", translation: 'exact', source: 'ben', expect: { kind: 'oll-edges', shape: 'line' } },
  { id: 'oll-l', cue: "fat f · sexy · fat f'", hold_text: "L on the front and right", stage: 'oll', name: 'L', ben_text: "L: fat f sexy move fat f'", moves: "f R U R' U' f'", translation: 'exact', source: 'ben', expect: { kind: 'oll-edges', shape: 'L', hold: 'L-FR' } }, // J Perm: hold the L on the front and the right

  // --- OLL corners (Ben 3-7) ---
  { id: 'oll-double-headlight', cue: 'Antisune, then Antisune', hold_text: 'Headlights front and back', stage: 'oll', name: 'Plus (double headlight)', ben_text: "Plus (double headlight)\nAntisune² on light\nF triple sexy F'", moves: "(R U2 R' U' R U' R')2", translation: 'interpreted', source: 'ben', expect: { kind: 'oll-corners', class: 'H', hold: 'headlights-FB' },
    alternative: { moves: "F (R U R' U')3 F'", label: "F triple sexy F' (J Perm)" },
    alt: { label: 'Antisune² on light', candidates: ["(R U2 R' U' R U' R')2", "R U2 R' U' R U' R' U R U2 R' U' R U' R'", "R U2 R' U' R U' R' U2 R U2 R' U' R U' R'", "R U2 R' U' R U' R' U' R U2 R' U' R U' R'"] } },
  { id: 'oll-sune', cue: 'take the front-right pair out, round, back in', hold_text: 'Yellow corner front-left; yellow on the front face, right corner', stage: 'oll', name: 'Sune (fish)', moves: "R U R' U R U2 R'", translation: 'standard', source: 'standard', note: 'Ben knows these; left out of his notes', expect: { kind: 'oll-corners', class: 'Sune/Antisune' } },
  { id: 'oll-antisune', cue: 'out with U2, over, back in', hold_text: 'Yellow corner back-right; yellow on the front face, left corner', stage: 'oll', name: 'Antisune (fish)', moves: "R U2 R' U' R U' R'", translation: 'standard', source: 'standard', note: 'Ben knows these; left out of his notes', expect: { kind: 'oll-corners', class: 'Sune/Antisune' } },
  { id: 'oll-headlight-blink', cue: "R U2 out · R2 U' out · R2 U' in · R2 U2 R in", hold_text: "Headlights on the left, blinker facing you", stage: 'oll', name: 'Plus (headlight and blink)', ben_text: "On blink, R U2 take pair out, R2 U' take the other pair out, top can see 2 pairs now\nReturn by R2 reinsert white R2 reinsert white", moves: "R U2 R2 U' R2 U' R2 U2 R", translation: 'interpreted', source: 'ben', expect: { kind: 'oll-corners', class: 'Pi' } },
  { id: 'oll-bowtie', cue: "x · R' U R D' · R' U' R D · x'", hold_text: "Solved corner front-right; x to face the white", stage: 'oll', name: 'Bowtie', ben_text: "x rotate up so you see white\nR' U R D' (white on first and third line goes left)\nThen return the white first third\nR' U' R D", moves: "x R' U R D' R' U' R D x'", translation: 'interpreted', source: 'ben', expect: { kind: 'oll-corners', class: 'L', hold: 'solved-UFR' }, // J Perm: a solved corner front-right
    candidates: ["x R' U R D' R' U' R D x'", "x' R' U R D' R' U' R D x"] },
  { id: 'oll-chameleon-headlight', cue: "R2 D · R' U2 R out · D' · R' U2 R'", hold_text: "Headlights facing you", stage: 'oll', name: 'Chameleon (headlight)', ben_text: "Headlight facing you R2 D  Remove with R' U2 R see pair on top\nThen undo D'\nReturn by R' U2 R'", moves: "R2 D R' U2 R D' R' U2 R'", translation: 'exact', source: 'ben', expect: { kind: 'oll-corners', class: 'U', hold: 'headlights-F' } },
  { id: 'oll-chameleon-blink', cue: 'fat sexy out · sledgehammer in', hold_text: 'Blink on the left', stage: 'oll', name: 'Chameleon (blink)', ben_text: 'Blink on left\nFat sexy move out, sledgehammer in', moves: "r U R' U' r' F R F'", translation: 'interpreted', source: 'ben', expect: { kind: 'oll-corners', class: 'T', hold: 'twisted-L' } },

  // --- PLL (Ben 1, 3-7) ---
  { id: 'pll-adj-corner', cue: "sexy · R' F · R2 U' R' U' · R U R' F'", hold_text: "Solved corners on the left, swap the right two", stage: 'pll', name: 'Adjacent corner swap', ben_text: "Right 2 corner swap:\nsexy move R U R' U' half sledgehammer R' F then R2 with 3 finger from top to bottom U' R' U' 3 step sexy move but with last step F'", moves: "R U R' U' R' F R2 U' R' U' R U R' F'", translation: 'interpreted', source: 'ben', expect: { kind: 'pll', class: 'adjacent corner swap', hold: 'swap-right' } },
  { id: 'pll-opp-edge', cue: "", hold_text: "Any angle", stage: 'pll', name: 'Opposite edge swap', ben_text: "M2 U' M2 U2 M2 U' M2", moves: "M2 U' M2 U2 M2 U' M2", translation: 'exact', source: 'ben', expect: { kind: 'pll', class: 'opposite edge swap' } },
  { id: 'pll-adj-edge', cue: "", hold_text: "Swapping pairs at front and right", stage: 'pll', name: 'Adjacent edge swap', ben_text: "M' U' M2 U' M2 U' M' U2 M2", moves: "M' U' M2 U' M2 U' M' U2 M2", translation: 'exact', source: 'ben', expect: { kind: 'pll', class: 'adjacent edge swap' } },
  { id: 'pll-3edge-rl', cue: "R U' · R U R U take out twice · back in", hold_text: "Solved edge at the back; right edge goes left", stage: 'pll', name: 'Three edge, right to left', ben_text: "R U' (R U R U) take out twice take back in R U' R' U' R2", moves: "R U' R U R U R U' R' U' R2", translation: 'interpreted', source: 'ben', expect: { kind: 'pll', class: 'three edge' } },
  { id: 'pll-3edge-lr', cue: "R2 U · R U R' U' · R' U' R' U R'", hold_text: "Solved edge at the back; left edge goes right", stage: 'pll', name: 'Three edge, left to right', ben_text: "R2 U R U R' U' R' U' R' U R'", moves: "R2 U R U R' U' R' U' R' U R'", translation: 'exact', source: 'ben', expect: { kind: 'pll', class: 'three edge' } },
  { id: 'pll-diag-corner', cue: "F \u00b7 inverse sexy \u00b7 3-move sexy \u00b7 undo F \u00b7 sexy \u00b7 sledgehammer", hold_text: "No headlights anywhere; any angle", stage: 'pll', name: 'Diagonal corner swap (Y perm)', ben_text: "(F R U' R' U' R U R' F') (R U R' U' R' F R F')\nF inverse sexy, 3 sexy move undo F (bottom white now)\nSexy move sledge hammer", moves: "F R U' R' U' R U R' F' R U R' U' R' F R F'", translation: 'exact', source: 'ben', expect: { kind: 'pll', class: 'diagonal corner swap' } },
];
