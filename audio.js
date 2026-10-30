/**
 * VisionChord - Classical Nylon Guitar Sound Engine (Gitar Klasik Akustik)
 * Warm, resonant Spanish/Classical nylon-string physical modeling
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bodyFilter = null;
    this.volume = 0.9;
    this.isMuted = false;

    // Voicing Gitar Klasik Nyata (Frekuensi Senar Asli Hz)
    this.chords = {
      'C': {
        name: 'C Major',
        tag: 'C',
        // Senar 5 ke 1: C3, E3, G3, C4, E4
        notes: [130.81, 164.81, 196.00, 261.63, 329.63],
        names: ['C3', 'E3', 'G3', 'C4', 'E4'],
        color: '#38bdf8'
      },
      'Am': {
        name: 'A Minor',
        tag: 'Am',
        // Senar 5 ke 1: A2, E3, A3, C4, E4
        notes: [110.00, 164.81, 220.00, 261.63, 329.63],
        names: ['A2', 'E3', 'A3', 'C4', 'E4'],
        color: '#a78bfa'
      },
      'G': {
        name: 'G Major',
        tag: 'G',
        // Senar 6 ke 1: G2, B2, D3, G3, D4, G4
        notes: [98.00, 123.47, 146.83, 196.00, 293.66, 392.00],
        names: ['G2', 'B2', 'D3', 'G3', 'D4', 'G4'],
        color: '#4ade80'
      },
      'Em': {
        name: 'E Minor',
        tag: 'Em',
        // Senar 6 ke 1: E2, B2, E3, G3, B3, E4
        notes: [82.41, 123.47, 164.81, 196.00, 246.94, 329.63],
        names: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'],
        color: '#f43f5e'
      },
      'D': {
        name: 'D Major',
        tag: 'D',
        // Senar 4 ke 1: D3, A3, D4, F#4
        notes: [146.83, 220.00, 293.66, 369.99],
        names: ['D3', 'A3', 'D4', 'F#4'],
        color: '#facc15'
      },
      'F': {
        name: 'F Major',
        tag: 'F',
        // Senar 6 ke 1: F2, C3, F3, A3, C4, F4
        notes: [87.31, 130.81, 174.61, 220.00, 261.63, 349.23],
        names: ['F2', 'C3', 'F3', 'A3', 'C4', 'F4'],
        color: '#fb923c'
      }
    };
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      // Resonansi Kayu Tabung Gitar Klasik (Wooden Body Chamber Emulation)
      const bodyLow = this.ctx.createBiquadFilter();
      bodyLow.type = 'peaking';
      bodyLow.frequency.value = 115; // Resonansi rongga udara bodi gitar klasik
      bodyLow.Q.value = 2.0;
      bodyLow.gain.value = 4.0;

      const bodyWarmth = this.ctx.createBiquadFilter();
      bodyWarmth.type = 'lowshelf';
      bodyWarmth.frequency.value = 240;
      bodyWarmth.gain.value = 2.5;

      const highSmooth = this.ctx.createBiquadFilter();
      highSmooth.type = 'lowpass';
      highSmooth.frequency.value = 5200; // Lembutkan frekuensi tinggi khas senar nilon
      highSmooth.Q.value = 0.8;

      // Reverb ruang akustik alami
      this.reverb = this.createAcousticRoom(1.8, 2.8);

      // Routing rantai audio
      bodyLow.connect(bodyWarmth);
      bodyWarmth.connect(highSmooth);
      highSmooth.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      if (this.reverb) {
        this.masterGain.connect(this.reverb);
      }

      this.bodyInput = bodyLow;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  createAcousticRoom(duration, decay) {
    const rate = this.ctx.sampleRate;
    const length = rate * duration;
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const dec = Math.pow(1 - n, decay);
      // Ruang akustik kayu hangat
      left[i] = (Math.random() * 2 - 1) * dec * 0.09;
      right[i] = (Math.random() * 2 - 1) * dec * 0.09;
    }

    const convolver = this.ctx.createConvolver();
    convolver.buffer = impulse;
    convolver.connect(this.ctx.destination);
    return convolver;
  }

  // Sintesis senar nilon gitar klasik: Transient petikan jari + gelombang harmonik hangat
  playNylonString(freq, startTime, velocity = 0.85) {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;

    // 1. Harmoni Senar Nilon (Triangle fundamental + Sawtooth lembut terfilter)
    const oscMain = ctx.createOscillator();
    const oscSub = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const stringGain = ctx.createGain();

    oscMain.type = 'triangle';
    oscMain.frequency.setValueAtTime(freq, startTime);

    oscSub.type = 'sawtooth';
    oscSub.frequency.setValueAtTime(freq * 1.0015, startTime); // Sedikit detune natural akustik

    // Filter dinamis khas senar nilon (bright di milidetik awal, lalu menjadi sangat hangat)
    filter.type = 'lowpass';
    const initialFreq = Math.min(freq * 4.5, 4200);
    const sustainFreq = Math.max(freq * 1.2, 180);
    filter.frequency.setValueAtTime(initialFreq, startTime);
    filter.frequency.exponentialRampToValueAtTime(sustainFreq, startTime + 0.9);
    filter.Q.setValueAtTime(1.8, startTime);

    // 2. Pluck Noise (Gesekan bantalan jari/kuku ke senar nilon saat dipetik)
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.035), ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
    }
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(Math.min(freq * 2.5, 2500), startTime);
    noiseFilter.Q.setValueAtTime(1.5, startTime);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08 * velocity, startTime);
    noiseNode.connect(noiseFilter);
    noiseFilter.connect(this.bodyInput);

    // 3. Envelope Pembentukan Suara (ADSR Natural Gitar Klasik)
    const attack = 0.006; // Petikan instan tapi lembut
    const decay = 2.4;    // Resonansi sustain panjang yang merdu
    const peakGain = 0.28 * velocity;

    stringGain.gain.setValueAtTime(0.0001, startTime);
    stringGain.gain.exponentialRampToValueAtTime(peakGain, startTime + attack);
    stringGain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

    // Koneksi ke tabung bodi gitar
    oscMain.connect(filter);
    oscSub.connect(filter);
    filter.connect(stringGain);
    stringGain.connect(this.bodyInput);

    // Jalankan osilator
    oscMain.start(startTime);
    oscSub.start(startTime);
    noiseNode.start(startTime);

    oscMain.stop(startTime + decay);
    oscSub.stop(startTime + decay);
  }

  // Genjrengan Realistis (Strumming dengan micro-delay antar dawai)
  playChord(chordKey, direction = 'down') {
    this.init();
    const chord = this.chords[chordKey];
    if (!chord) return null;

    const now = this.ctx.currentTime;
    // Down-strum: Senar bass ke treble (E rendah ke E tinggi)
    // Up-strum: Senar treble ke bass (E tinggi ke E rendah)
    const notes = direction === 'down' ? [...chord.notes] : [...chord.notes].reverse();
    
    // Kecepatan sapuan genjrengan nilon (18ms - 22ms per senar)
    const strumSpeed = 0.020;

    notes.forEach((freq, idx) => {
      const stringTime = now + (idx * strumSpeed);
      // Variasi tekanan alami jari saat menggenjreng
      const vel = 0.82 + (Math.random() * 0.18);
      this.playNylonString(freq, stringTime, vel);
    });

    return chord;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }
}

window.soundEngine = new SoundEngine();
