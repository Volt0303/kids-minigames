#!/usr/bin/env node
/**
 * Generates simple placeholder sound effects (sine tones) into public/sfx/.
 * Self-made, so there is no licence to track. Replace with final sounds later.
 *
 * Usage: node tools/generate-placeholder-sfx.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const RATE = 22050;
const OUT_DIR = 'public/sfx';

/** Each note: [start frequency Hz, end frequency Hz, duration s]. */
const SOUNDS = {
  correct: [
    [880, 880, 0.08],
    [1320, 1320, 0.14],
  ],
  wrong: [[330, 220, 0.22]],
  clear: [
    [660, 660, 0.1],
    [880, 880, 0.1],
    [1100, 1100, 0.1],
    [1320, 1320, 0.25],
  ],
};

function renderNotes(notes) {
  const samples = [];
  for (const [from, to, seconds] of notes) {
    const count = Math.floor(RATE * seconds);
    let phase = 0;
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const envelope = Math.min(1, i / 150) * (1 - t);
      phase += (2 * Math.PI * (from + (to - from) * t)) / RATE;
      samples.push(Math.round(11000 * envelope * Math.sin(phase)));
    }
  }
  return samples;
}

function toWav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((value, i) => data.writeInt16LE(value, i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, notes] of Object.entries(SOUNDS)) {
  const file = `${OUT_DIR}/${name}.wav`;
  writeFileSync(file, toWav(renderNotes(notes)));
  console.log(`wrote ${file}`);
}
