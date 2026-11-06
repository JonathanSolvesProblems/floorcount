// Floorcount practice loops: original salsa groove, generated (no samples, no licensed music).
// Clave on counts 1 and 5, tumbao bass (anticipated), conga tumbao (open tones on 4 and 8),
// piano montuno over I-IV-V-IV. One count per beat. Each file is exactly LOOP_COUNTS beats long
// so it loops seamlessly and count 1 sits at sample 0 (the Lens reads the playback clock).
const path = require('path');
const fs = require('fs');
// CLAD's build-music tools live in the ls-clad plugin, not in this repository. Point
// CLAD_SKILLS_DIR at the plugin's skills folder (for example <plugin folder>/plugins/cache/
// ls-extensions/ls-clad/1.0.0/skills) to run this again.
const m = require(path.join(process.env.CLAD_SKILLS_DIR || '.', 'build-music', 'tools'));
const A = m.audio_primitives;
const SR = A.SAMPLE_RATE;

const PROJECT_ASSETS_SFX = path.join(__dirname, '..', 'Assets', 'GeneratedSFX');
fs.mkdirSync(PROJECT_ASSETS_SFX, { recursive: true });

const EIGHT_COUNTS = 4;            // phrases per loop
const LOOP_BEATS = 8 * EIGHT_COUNTS;
const TEMPOS = [
  { name: 'FloorcountSalsa140', bpm: 140 },
  { name: 'FloorcountSalsa170', bpm: 170 },
  { name: 'FloorcountSalsa190', bpm: 190 },
];

// Key: pick a fresh major key each run (variety), same key for all three tempos so the
// three loops read as one song at three speeds.
const KEYS = ['C', 'D', 'F', 'G', 'A', 'Bb'];
const KEY = KEYS[Math.floor(Math.random() * KEYS.length)];
const NOTE = { C: 0, D: 2, F: 5, G: 7, A: 9, Bb: 10 };
const ROOT = 48 + NOTE[KEY]; // key root around C3
// I IV V IV, two counts each: one progression per 8-count.
const PROG = [0, 5, 7, 5];   // semitone offsets of chord roots
const chordAtBeat = (b) => PROG[Math.floor(((b % 8) + 8) % 8 / 2)];
const triad = (r) => [r, r + 4, r + 7];

const jit = (t) => (t <= 0 ? t : t + (Math.random() - 0.5) * 0.02); // tiny feel jitter in beats, never before 0

// ---- custom voices -------------------------------------------------------
function claveVoice(midi, durBeats, velocity) {
  const v = velocity / 127;
  const len = 0.09;
  const a = A.sine(2480, len, 0.8);
  const b = A.sine(3900, len, 0.25);
  const out = new Float32Array(Math.floor(len * SR));
  A.addInto(out, a, 0, 1); A.addInto(out, b, 0, 1);
  A.adsrExp(out, 0.0005, 0.03, 0, 0.05, 4);
  const click = A.whiteNoise(0.004, 0.5);
  A.addInto(out, click, 0, 0.3);
  A.fadeOut(out, 0.005);
  for (let i = 0; i < out.length; i++) out[i] *= 0.9 * v;
  return out;
}
function congaVoice(midi, durBeats, velocity) {
  const v = velocity / 127;
  const f = 440 * Math.pow(2, (midi - 69) / 12);
  if (midi >= 80) { // slap
    const n = A.whiteNoise(0.06, 1);
    A.bandPass(n, 2600, 1.2);
    A.adsrExp(n, 0.0005, 0.02, 0, 0.035, 4);
    const t = A.sweep(f * 0.5 * 1.1, f * 0.5, 0.06, 'sine', 'exponential');
    A.adsrExp(t, 0.0005, 0.03, 0, 0.03, 4);
    const out = new Float32Array(n.length);
    A.addInto(out, n, 0, 0.7); A.addInto(out, t, 0, 0.4);
    for (let i = 0; i < out.length; i++) out[i] *= v;
    return out;
  }
  const muted = midi < 55;
  const len = muted ? 0.07 : 0.32;
  const out = A.sweep(f * 1.07, f, len, 'sine', 'exponential');
  A.adsrExp(out, 0.001, muted ? 0.03 : 0.12, 0, muted ? 0.035 : 0.18, 3);
  const click = A.whiteNoise(0.005, 0.4);
  A.lowPass2(click, 3000, 1.0);
  A.addInto(out, click, 0, 0.3);
  A.fadeOut(out, 0.004);
  for (let i = 0; i < out.length; i++) out[i] *= (muted ? 0.35 : 0.8) * v;
  return out;
}

function buildTracks() {
  const clave = [], bass = [], conga = [], piano = [], shaker = [];
  for (let p = 0; p < EIGHT_COUNTS; p++) {
    const base = p * 8;
    // Clave: counts 1 and 5, exactly on the beat.
    clave.push({ time: base + 0, beats: 0.25, value: 90, velocity: 118 });
    clave.push({ time: base + 4, beats: 0.25, value: 90, velocity: 108 });
    // Tumbao bass: "and of 2" and "4" in each bar, anticipating the next chord.
    for (const bar of [0, 4]) {
      const b = base + bar;
      // and-of-2: fifth of the chord landing on 3; 4: root of the chord landing on the next 1/5.
      bass.push({ time: jit(b + 1.5), beats: 1.4, value: ROOT - 12 + chordAtBeat(b + 2) + 7 - 12 + 12, velocity: 100 });
      bass.push({ time: jit(b + 3.0), beats: 2.4, value: ROOT - 12 + chordAtBeat(b + 4), velocity: 108 });
    }
    // Conga tumbao per bar: heel-toe (muted) on 1, 1&, 3, 3&; slap on 2; open tones on 4 and 4&.
    for (const bar of [0, 4]) {
      const b = base + bar;
      conga.push({ time: jit(b + 0), beats: 0.25, value: 52, velocity: 70 });
      conga.push({ time: jit(b + 0.5), beats: 0.25, value: 52, velocity: 55 });
      conga.push({ time: jit(b + 1), beats: 0.25, value: 84, velocity: 95 });
      conga.push({ time: jit(b + 2), beats: 0.25, value: 52, velocity: 65 });
      conga.push({ time: jit(b + 2.5), beats: 0.25, value: 52, velocity: 55 });
      conga.push({ time: jit(b + 3), beats: 0.5, value: 64, velocity: 105 });
      conga.push({ time: jit(b + 3.5), beats: 0.5, value: 64, velocity: 100 });
    }
    // Shaker 8ths, accent on the beat.
    for (let e = 0; e < 16; e++) shaker.push({ time: jit(base + e * 0.5), beats: 0.25, value: 60, velocity: e % 2 ? 50 : 72 });
    // Piano montuno: syncopated 8ths, octave root on downbeat-ish hits, triad on off-beats,
    // off-beat hits anticipate the next chord (classic montuno push).
    const hits = [0, 1.5, 2, 3, 3.5, 4, 5.5, 6, 7, 7.5];
    for (const h of hits) {
      const anticip = (h % 1) !== 0;
      const r = ROOT + 12 + chordAtBeat(base + h + (anticip ? 0.5 : 0));
      const notes = (h % 2 === 0) ? [r, r + 12] : triad(r).slice(1).concat([r + 12]);
      for (const n of notes) piano.push({ time: jit(base + h), beats: 0.45, value: n, velocity: anticip ? 92 : 80 });
    }
  }
  return [
    m.track('clave', claveVoice, clave, { quantize: 'strict', fx: { hpf: 800, gain: 0.55, pan: 0.15 } }),
    m.track('bass', 'synthBass', bass, { quantize: 'strict', fx: { hpf: 45, lpf: 800, gain: 0.62 } }),
    m.track('conga', congaVoice, conga, { quantize: 'strict', fx: { hpf: 90, reverb: 'smallRoom', gain: 0.6, pan: -0.25 } }),
    m.track('shaker', 'shaker', shaker, { quantize: 'strict', fx: { hpf: 4000, gain: 0.25, pan: 0.35 } }),
    m.track('piano', 'piano', piano, { quantize: 'strict', fx: { hpf: 220, lpf: 5000, reverb: 'mediumRoom', gain: 0.4, pan: 0.1 } }),
  ];
}

for (const t of TEMPOS) {
  const loopSec = LOOP_BEATS * 60 / t.bpm;
  const loopSamples = Math.round(loopSec * SR);
  const out = m.render(buildTracks(), { bpm: t.bpm, duration: loopSec + 3, master: { normalize: 'peak', glue: true, width: 1.1 } });
  // Fold the tail past the loop point back onto the start so the loop is seamless.
  const L = new Float32Array(loopSamples), R = new Float32Array(loopSamples);
  for (let i = 0; i < out.left.length; i++) { L[i % loopSamples] += out.left[i]; R[i % loopSamples] += out.right[i]; }
  let peak = 0;
  for (let i = 0; i < loopSamples; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = 0.89 / (peak || 1);
  for (let i = 0; i < loopSamples; i++) { L[i] *= g; R[i] *= g; }
  const file = path.join(PROJECT_ASSETS_SFX, t.name + '.wav');
  m.WavBuilder.write({ left: L, right: R }, file);
  console.log(JSON.stringify({ file, bpm: t.bpm, key: KEY, beats: LOOP_BEATS, seconds: loopSamples / SR }));
}
