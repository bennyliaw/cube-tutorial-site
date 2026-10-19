// Live app: play any case, or scramble any cube and watch it solved the way
// the tutorial teaches. Everything is computed by the engine and solver; the
// animation is the shared timeline. No AI at runtime.
import { solved, apply, parse, fmt } from '../src/cube.js';
import { CASES } from '../src/cases.js';
import { caseCube, caseFocus } from '../src/draw.js';
import { createView } from '../src/scene3d.js';
import { buildTimeline } from '../src/timeline.js';
import { solve } from '../src/solver.js';
import { pllEffect } from '../scripts/verify-lib.js';
import { unlockAudio, clack } from '../src/sound.js';

const $ = (id) => document.getElementById(id);
const canvas = $('gl');
const dpr = Math.min(window.devicePixelRatio || 1, 2);
const view = createView(canvas, { width: 800, height: 600 });
// A tall canvas (tablet or phone held upright) widens the vertical field of
// view so the cube still fits side to side.
function fit() {
  view.resize(Math.round(canvas.clientWidth * dpr), Math.round(canvas.clientHeight * dpr));
  view.camera.fov = 2 * Math.atan(Math.tan((28 / 2) * Math.PI / 180) / Math.min(1, view.camera.aspect)) * 180 / Math.PI;
  view.camera.updateProjectionMatrix();
}
window.addEventListener('resize', fit);

// Cubers' convention: whole-cube turns (x y z) are not counted as moves.
const isTurn = (mv) => !'xyz'.includes(mv.m);
let sound = localStorage.getItem('sound') !== 'off', lastClack = -1;
let boost = 1; // the scramble plays 4x: it is not the lesson
let solving = false, keep = null, tl = null, n = 0, playing = false, speed = 1, rot = [0, 0], scrambled = solved();
const STAGE_NAMES = { cross: 'Cross', f2l: 'F2L', oll: 'OLL', pll: 'PLL' };

function load(start, segments, autoplay = true, focus = null, isSolve = false) {
  keep = focus; solving = isSolve; lastClack = -1; boost = 1; lastSeg = -1; // redraw the info text
  tl = buildTimeline(start, segments, { intro: 20, outro: 20 });
  n = 0; playing = autoplay;
  $('scrub').max = tl.total;
  $('play').textContent = playing ? '⏸' : '▶';
}

// --- Cases tab ----------------------------------------------------------------
function caseLabel(k) {
  if (k.stage === 'f2l') return 'F2L';
  if (k.stage === 'oll') return k.expect.kind === 'oll-edges' ? 'OLL · step 1 · yellow cross' : 'OLL · step 2 · yellow corners';
  return k.expect.class.includes('corner') ? 'PLL · step 1 · corners' : 'PLL · step 2 · edges';
}
function showCases() {
  $('tabCases').classList.add('on'); $('tabSolve').classList.remove('on');
  const groups = {};
  for (const k of CASES) (groups[caseLabel(k)] ||= []).push(k);
  $('side').innerHTML = '<div class="list">' + Object.entries(groups).map(([g, ks]) => `<h3>${g}</h3>` + ks.map((k) =>
    `<div class="item" data-id="${k.id}">${k.name}<small>${k.hold_text}</small><span class="mv">${k.moves}</span></div>`).join('')).join('') + '</div>';
  $('side').querySelectorAll('.item').forEach((el) => el.onclick = () => playCase(el.dataset.id));
}
function playCase(id) {
  const k = CASES.find((c) => c.id === id);
  const auf = k.stage === 'pll' ? pllEffect(k.moves).auf : '';
  const moves = `${k.moves} ${auf}`.trim();
  const start = caseCube(k.moves, auf);
  load(start, [{ moves, stage: caseLabel(k), title: k.name, say: [k.hold_text, k.cue].filter(Boolean).join(' · ') + (auf ? ` · last ${auf} lines the top up` : '') }], true, caseFocus(k, start));
  $('side').querySelectorAll('.item').forEach((el) => el.classList.toggle('on', el.dataset.id === id));
}

// --- Solve tab ------------------------------------------------------------------
const FACES = ['U', 'D', 'R', 'L', 'F', 'B'];
function randomScramble(len = 22) {
  const out = []; let last = '';
  while (out.length < len) {
    const f = FACES[Math.floor(Math.random() * 6)];
    if (f === last) continue;
    last = f; out.push(f + ['', "'", '2'][Math.floor(Math.random() * 3)]);
  }
  return out.join(' ');
}
function showSolve() {
  $('tabSolve').classList.add('on'); $('tabCases').classList.remove('on');
  $('side').innerHTML = `<div id="scrbox"><h3>Scramble</h3>
    <textarea id="scr" spellcheck="false" placeholder="e.g. R U F2 D' L ...">${localStorage.getItem('scramble') || randomScramble()}</textarea>
    <div class="row"><button id="rand">Random</button><button id="apply">Show scramble</button><button id="go" class="on">Solve it</button></div>
    <div class="hint">Type the moves you used to scramble your cube (hold yellow up, green front), or press Random.</div>
    <div id="msg"></div></div><div id="steps"></div>`;
  $('rand').onclick = () => { $('scr').value = randomScramble(); showScramble(); };
  $('apply').onclick = showScramble;
  $('go').onclick = runSolve;
  showScramble();
}
function readScramble() {
  const s = $('scr').value.trim();
  const moves = parse(s);
  if (s && !moves.length) throw new Error('could not read those moves');
  localStorage.setItem('scramble', s);
  return s;
}
function showScramble() {
  try {
    const s = readScramble();
    scrambled = apply(solved(), s);
    load(solved(), [{ moves: s, stage: 'Scramble', title: 'Scrambling', say: 'From solved, these moves mix the cube up.' }], true);
    tl.segs[0].pauseAfter = 0; boost = 4;
    $('msg').innerHTML = ''; $('steps').innerHTML = '';
  } catch (e) { $('msg').innerHTML = `<p class="err">${e.message}</p>`; }
}
function runSolve() {
  let steps;
  try { scrambled = apply(solved(), readScramble()); steps = solve(scrambled); } catch (e) { $('msg').innerHTML = `<p class="err">${e.message}</p>`; return; }
  if (!steps.length) { $('msg').innerHTML = '<p class="hint">That cube is already solved.</p>'; $('steps').innerHTML = ''; return; }
  const segs = steps.map((s) => ({ moves: s.moves, pauseAfter: 14, stage: s.stage, title: s.title, say: s.say }));
  load(scrambled, segs, true, null, true);
  const total = steps.reduce((t, s) => t + parse(s.moves).filter(isTurn).length, 0);
  let html = `<p class="hint">${steps.length} steps · ${total} moves</p>`, last = '';
  segs.forEach((s, i) => {
    if (s.stage !== last) { html += `<h3>${s.stage}</h3>`; last = s.stage; }
    html += `<div class="item" data-seg="${i}">${s.title}<small>${s.say}</small><span class="mv">${s.moves}</span></div>`;
  });
  $('steps').innerHTML = html;
  $('steps').querySelectorAll('.item').forEach((el) => el.onclick = () => { n = tl.segs[+el.dataset.seg].from; playing = false; $('play').textContent = '▶'; });
}

// --- playback --------------------------------------------------------------------
function jump(dir) {
  if (!tl || !tl.segs.length) return;
  const { seg } = tl.at(n);
  const s = tl.segs[seg];
  if (dir < 0) n = n > s.from + 2 ? s.from : (tl.segs[seg - 1] || s).from;
  else n = (tl.segs[seg + 1] || { from: tl.total }).from;
  playing = false; $('play').textContent = '▶';
}
$('prev').onclick = () => jump(-1);
$('next').onclick = () => jump(1);
$('play').onclick = () => { if (tl && n >= tl.total) n = 0; playing = !playing; $('play').textContent = playing ? '⏸' : '▶'; };
$('scrub').oninput = (e) => { n = +e.target.value; playing = false; $('play').textContent = '▶'; };
$('speed').onchange = (e) => { speed = +e.target.value; };
$('tabCases').onclick = showCases;
// Sound: one clack per turn while playing; the browser needs a gesture first.
const soundBtn = () => { $('sound').textContent = sound ? '🔊' : '🔇'; };
$('sound').onclick = () => { sound = !sound; localStorage.setItem('sound', sound ? 'on' : 'off'); soundBtn(); };
soundBtn();
for (const ev of ['pointerdown', 'keydown']) document.addEventListener(ev, unlockAudio);
$('tabSolve').onclick = showSolve;
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'TEXTAREA') return;
  if (e.key === ' ') { e.preventDefault(); $('play').click(); }
  if (e.key === 'ArrowLeft') jump(-1);
  if (e.key === 'ArrowRight') jump(1);
});
let drag = null;
canvas.addEventListener('pointerdown', (e) => { drag = [e.clientX, e.clientY, ...rot]; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => { if (drag) rot = [Math.max(-1.5, Math.min(1.5, drag[2] + (e.clientY - drag[1]) / 200)), drag[3] + (e.clientX - drag[0]) / 200]; });
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('dblclick', () => { rot = [0, 0]; });

let lastT = performance.now(), lastSeg = -1, lastMove = -1;
function frame(t) {
  const dt = Math.min(0.1, (t - lastT) / 1000); lastT = t;
  if (tl) {
    if (playing) { n += dt * 30 * speed * boost; if (n >= tl.total) { n = tl.total; playing = false; $('play').textContent = '▶'; } }
    const { cube, turn, move, seg } = tl.at(n);
    if (playing && turn && move !== lastClack) { lastClack = move; if (sound) clack(); }
    view.draw(cube, { turn, orbit: rot, scale: 0.72, keep });
    $('scrub').value = n;
    const s = tl.segs[seg];
    if (seg !== lastSeg || move !== lastMove) {
      lastSeg = seg; lastMove = move;
      $('info').querySelector('.stage').textContent = s?.stage || '';
      $('info').querySelector('.title').textContent = s?.title || '';
      $('info').querySelector('.say').textContent = s?.say || '';
      const toks = s ? parse(s.moves) : [];
      $('strip').innerHTML = toks.map((mv, i) => {
        const gi = s.firstMove + i;
        return `<span class="${gi < move ? 'done' : gi === move ? 'now' : ''}">${fmt([mv])}</span>`;
      }).join(' ');
      const turns = tl.steps.filter((st) => isTurn(st.mv)).length;
      const done = tl.steps.slice(0, move).filter((st) => isTurn(st.mv)).length;
      $('info').querySelector('.count').textContent = !turns ? ''
        : move >= tl.steps.length ? (solving ? `Solved in ${turns} moves` : `Done · ${turns} moves`)
        : `Move ${Math.min(done + 1, turns)} of ${turns}`;
      document.querySelectorAll('#steps .item').forEach((el) => el.classList.toggle('on', +el.dataset.seg === seg));
    }
  }
  requestAnimationFrame(frame);
}
window.__app = { get tl() { return tl; } }; // for the headless test
fit();
showCases();
playCase(CASES.find((c) => c.stage === 'oll' && c.expect.kind === 'oll-corners').id);
requestAnimationFrame(frame);
