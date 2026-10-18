// Cube-turn "clack", synthesised with Web Audio: no sound file, nothing to
// licence. One soft, identical tick per turn (Ben, 18 Oct: gentler, uniform):
// fixed pitch, fixed level, a gentle attack, low-passed so it isn't sharp.
let ctx = null, noise = null, out = null;

// Browsers only allow audio after a user gesture: call this from one.
export function unlockAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    noise = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.06), ctx.sampleRate);
    const d = noise.getChannelData(0);
    let seed = 1; // fixed noise: every tick is the same sound
    for (let i = 0; i < d.length; i++) { seed = (seed * 16807) % 2147483647; d[i] = (seed / 1073741823.5 - 1) * Math.pow(1 - i / d.length, 4); }
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    const level = ctx.createGain(); level.gain.value = 0.18;
    lp.connect(level).connect(ctx.destination);
    out = lp;
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function clack() {
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = noise;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9; bp.frequency.value = 1400;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 0.004); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  src.connect(bp).connect(g).connect(out); src.start(t);
}
