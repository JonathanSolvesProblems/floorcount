const path = require('path');
const fs = require('fs');
const audio = require(require('path').join(process.env.CLAD_SKILLS_DIR, 'build-sfx', 'tools'));
const A = audio.audio_primitives;
const SR = A.SAMPLE_RATE;
const PROJECT_ASSETS_SFX = require('path').join(__dirname, '..', 'Assets', 'GeneratedSFX');
fs.mkdirSync(PROJECT_ASSETS_SFX, { recursive: true });

// Clave click: hardwood clave, bright tonal knock (~2.5 kHz) + stick attack. Layered attack + body.
function clave() {
  const body = audio.transient_designer.designImpact({
    attack: { kind: 'click', durationMs: 4, lpHz: 9000, hpHz: 1500, gain: 0.55 },
    body:   { kind: 'tonal', freq: 2500, partials: 3, decay: 0.07, hpHz: 900, lpHz: 9000, gain: 0.8 },
  });
  const out = audio.mix_bus.applyFx(body, { hpf: 600, reverb: 'smallRoom', gain: 0.9 });
  return out;
}
const items = [
  ['FloorcountClaveClick', clave()],
  ['FloorcountUiTap', audio.sfx_presets.uiClick({ character: 'soft' })],
  ['FloorcountStepMastered', audio.sfx_presets.uiSuccess()],
];
for (const [name, buf] of items) {
  audio.mix_bus.masterChain(buf, { normalize: 'peak' });
  if (buf.left) { A.fadeOut(buf.left, 0.006); A.fadeOut(buf.right, 0.006); } else A.fadeOut(buf, 0.006);
  audio.WavBuilder.write(buf, path.join(PROJECT_ASSETS_SFX, name + '.wav'));
}
