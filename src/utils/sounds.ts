/**
 * Sons sintetizados via PCM — sem arquivos de áudio pré-gravados.
 * Porta direta do sounds.js do handoff (Web Audio API → typed arrays).
 * Em produção: substituir por samples WAV/OGG para maior qualidade.
 */
import { Audio } from 'expo-av';
import { File, Paths } from 'expo-file-system';

// ─── PCM synthesis ───────────────────────────────────────────

const SAMPLE_RATE = 22050;

interface ToneParams {
  freq: number;
  dur: number;
  type: 'sine' | 'triangle' | 'square';
  vol: number;
  attack: number;
  release: number;
  slideTo?: number;
  when?: number;
}

function renderTone(p: ToneParams, rate: number, buf: Float32Array): void {
  const when = p.when ?? 0;
  const start = Math.floor(when * rate);
  const totalSamples = Math.ceil((p.dur + p.release + 0.06) * rate);

  for (let i = 0; i < totalSamples; i++) {
    const idx = start + i;
    if (idx >= buf.length) break;
    const t = i / rate;

    // Frequency with exponential slide
    let freq = p.freq;
    if (p.slideTo !== undefined && p.dur > 0) {
      const ratio = Math.min(t / p.dur, 1);
      freq = p.freq * Math.pow(Math.max(1, p.slideTo) / Math.max(1, p.freq), ratio);
    }

    // Waveform
    const phase = ((freq * t) % 1 + 1) % 1;
    let sample: number;
    switch (p.type) {
      case 'triangle': sample = 1 - 4 * Math.abs(phase - 0.5); break;
      case 'square':   sample = phase < 0.5 ? 1 : -1; break;
      default:         sample = Math.sin(2 * Math.PI * freq * t);
    }

    // Envelope
    let env: number;
    if (t < p.attack)      env = t / p.attack;
    else if (t < p.dur)    env = 1;
    else env = Math.max(0, 1 - (t - p.dur) / Math.max(0.001, p.release));

    buf[idx] += sample * env * p.vol;
  }
}

// ─── WAV encoding → ArrayBuffer ──────────────────────────────

function floatToWavBuffer(samples: Float32Array, rate: number): ArrayBuffer {
  const dataBytes = samples.length * 2;
  const ab = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(ab);
  const str = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  str(0, 'RIFF'); view.setUint32(4, 36 + dataBytes, true);
  str(8, 'WAVE'); str(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); str(36, 'data');
  view.setUint32(40, dataBytes, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, Math.round(s * 0x7fff), true);
  }
  return ab;
}

// ─── Sound synthesis (exact port of sounds.js) ───────────────

function buildDrop(): ArrayBuffer {
  const buf = new Float32Array(Math.ceil(0.4 * SAMPLE_RATE));
  renderTone({ freq: 800, slideTo: 280, dur: 0.18, type: 'sine',     vol: 0.22, attack: 0.003, release: 0.08, when: 0    }, SAMPLE_RATE, buf);
  renderTone({ freq: 1600, slideTo: 900, dur: 0.08, type: 'triangle', vol: 0.06, attack: 0.002, release: 0.04, when: 0.02 }, SAMPLE_RATE, buf);
  return floatToWavBuffer(buf, SAMPLE_RATE);
}

function buildFanfare(): ArrayBuffer {
  const buf = new Float32Array(Math.ceil(1.45 * SAMPLE_RATE));
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    renderTone({ freq: f, dur: 0.10, type: 'triangle', vol: 0.18, attack: 0.005, release: 0.06, when: i * 0.09 }, SAMPLE_RATE, buf)
  );
  const cw = 0.42;
  [523.25, 659.25, 783.99].forEach(f =>
    renderTone({ freq: f, dur: 0.55, type: 'triangle', vol: 0.13, attack: 0.01, release: 0.25, when: cw }, SAMPLE_RATE, buf)
  );
  renderTone({ freq: 1568, dur: 0.30, type: 'sine', vol: 0.10, attack: 0.005, release: 0.20, when: cw + 0.10 }, SAMPLE_RATE, buf);
  renderTone({ freq: 2093, dur: 0.20, type: 'sine', vol: 0.07, attack: 0.005, release: 0.15, when: cw + 0.18 }, SAMPLE_RATE, buf);
  return floatToWavBuffer(buf, SAMPLE_RATE);
}

// ─── File cache via expo-file-system v19 ─────────────────────

const _uriCache: Record<string, string> = {};

async function getUri(name: string, builder: () => ArrayBuffer): Promise<string> {
  if (_uriCache[name]) return _uriCache[name];
  const wavAb = builder();
  const file = new File(Paths.cache, `${name}.wav`);
  const writer = file.writableStream().getWriter();
  await writer.write(new Uint8Array(wavAb));
  await writer.close();
  _uriCache[name] = file.uri;
  return file.uri;
}

// ─── Playback ────────────────────────────────────────────────

let _muted = false;

export function setMuted(v: boolean): void  { _muted = v; }
export function isMuted(): boolean           { return _muted; }

async function play(uri: string): Promise<void> {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
    sound.setOnPlaybackStatusUpdate(status => {
      if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
    });
  } catch {
    // Audio is non-critical — fail silently
  }
}

export async function playDrop(): Promise<void> {
  if (_muted) return;
  const uri = await getUri('copinho_drop', buildDrop);
  play(uri);
}

export async function playFanfare(): Promise<void> {
  if (_muted) return;
  const uri = await getUri('copinho_fanfare', buildFanfare);
  play(uri);
}

/** Pre-warms the cache on startup to avoid first-play latency. */
export function prewarm(): void {
  getUri('copinho_drop',    buildDrop).catch(() => {});
  getUri('copinho_fanfare', buildFanfare).catch(() => {});
}
