/**
 * voice-script.mjs — shared by the narrated demo and the reel.
 *
 * A script is a list of lines ("steps"), each with the words the voice speaks. Each line gets a hash of
 * the words as spoken (after `pronounce` respellings) and the voice, so a recorded take is played only
 * when it was made from exactly those words and that voice; change a word and the take is stale.
 */
import crypto from 'node:crypto';

export function spoken(text, pronounce = {}) {
  let t = String(text);
  for (const [word, say] of Object.entries(pronounce).sort((a, b) => b[0].length - a[0].length)) {
    t = t.replace(new RegExp(`(?<![\\w-])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`, 'g'), say);
  }
  return t;
}

export function buildScript(source) {
  const voice = source.voice;
  const steps = source.steps.map(s => {
    const say = spoken(s.say ?? s.text, source.pronounce);
    const hash = crypto.createHash('sha1').update(JSON.stringify([say, voice.engine, voice.voice, voice.speed])).digest('hex').slice(0, 10);
    return { ...s, say, hash };
  });
  const ids = new Set();
  for (const s of steps) { if (ids.has(s.id)) throw new Error(`duplicate step id "${s.id}"`); ids.add(s.id); }
  return { ...source, steps };
}

/** Takes that are current: the manifest's record is used only if its hash matches the step's. */
export function currentTakes(script, manifest) {
  const out = {};
  for (const s of script.steps) {
    const t = manifest && manifest.takes && manifest.takes[s.id];
    if (t && t.hash === s.hash && t.seconds > 0) out[s.id] = { hash: t.hash, seconds: t.seconds };
  }
  return out;
}
