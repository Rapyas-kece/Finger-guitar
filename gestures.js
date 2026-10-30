/**
 * VisionChord - Smooth Hand Tracking & Super-Easy Chord Recognition
 * Features:
 * 1. Exponential Moving Average (EMA) Landmark Smoothing (Eliminates Jitter)
 * 2. Ultra-Simple Chord Gestures (Count 1 to 5 Fingers + Thumbs Up)
 * 3. Responsive Strum Detection for Right Hand
 */

class GestureRecognizer {
  constructor() {
    this.lastChord = null;
    this.stableChord = null;
    this.stableCount = 0;
    this.stabilityThreshold = 2; // Responsif & cepat mendeteksi

    // Smoothing state (Simpan landmark sebelumnya untuk lerp / filter EMA)
    this.smoothedHands = {};
    this.smoothAlpha = 0.55; // Nilai 0.5 - 0.65 menghasilkan gerakan sangat halus tanpa lag

    // Strumming tracking
    this.strumHistory = [];
    this.lastStrumTime = 0;
    this.strumCooldownMs = 180; // Waktu jeda antar genjrengan responsif
  }

  // Terapkan filter EMA (Exponential Moving Average) agar sendi jari tidak goyang
  smoothLandmarks(handKey, rawLandmarks) {
    if (!rawLandmarks || rawLandmarks.length < 21) return rawLandmarks;

    if (!this.smoothedHands[handKey]) {
      this.smoothedHands[handKey] = rawLandmarks.map(p => ({ x: p.x, y: p.y, z: p.z || 0 }));
      return this.smoothedHands[handKey];
    }

    const prev = this.smoothedHands[handKey];
    const smoothed = rawLandmarks.map((p, i) => {
      return {
        x: prev[i].x * this.smoothAlpha + p.x * (1 - this.smoothAlpha),
        y: prev[i].y * this.smoothAlpha + p.y * (1 - this.smoothAlpha),
        z: (prev[i].z || 0) * this.smoothAlpha + (p.z || 0) * (1 - this.smoothAlpha)
      };
    });

    this.smoothedHands[handKey] = smoothed;
    return smoothed;
  }

  // Analisis jari yang terbuka dengan cara super akurat & mudah
  analyzeFingers(landmarks) {
    const wrist = landmarks[0];

    // Jari dianggap terbuka jika ujung jari (TIP) berada lebih jauh dari pangkal (MCP)
    const isUp = (tipIdx, pipIdx) => {
      // Sumbu Y terbalik: Nilai Y lebih kecil = jari mengarah ke atas
      return landmarks[tipIdx].y < landmarks[pipIdx].y;
    };

    const indexUp = isUp(8, 6);
    const middleUp = isUp(12, 10);
    const ringUp = isUp(16, 14);
    const pinkyUp = isUp(20, 18);

    // Jempol terbuka (jarak horizontal & jarak dari telapak)
    const thumbTip = landmarks[4];
    const thumbMCP = landmarks[2];
    const indexMCP = landmarks[5];
    const dx = Math.abs(thumbTip.x - indexMCP.x);
    const thumbUp = dx > 0.08 || (thumbTip.y < thumbMCP.y && !indexUp && !middleUp);

    const count = (indexUp ? 1 : 0) + (middleUp ? 1 : 0) + (ringUp ? 1 : 0) + (pinkyUp ? 1 : 0);

    return {
      thumb: thumbUp,
      index: indexUp,
      middle: middleUp,
      ring: ringUp,
      pinky: pinkyUp,
      fingerCount: count,
      totalCount: count + (thumbUp ? 1 : 0)
    };
  }

  // Identifikasi Chord: Sistem Jumlah Jari yang Super Gampang & Anti-Ribet
  identifyChord(landmarks) {
    if (!landmarks || landmarks.length < 21) return null;

    const f = this.analyzeFingers(landmarks);

    // 1. D Major: Jempol saja (Thumbs Up 👍)
    if (f.thumb && f.fingerCount === 0) {
      return { chord: 'D', name: 'D Major', gesture: '👍 Jempol (Thumbs Up)' };
    }

    // 2. C Major: 1 Jari (Telunjuk tegak ☝️)
    if (f.fingerCount === 1 && f.index) {
      return { chord: 'C', name: 'C Major', gesture: '☝️ 1 Jari (Telunjuk)' };
    }

    // 3. Am (A Minor): 2 Jari (Telunjuk + Tengah / Peace ✌️)
    if (f.fingerCount === 2 && f.index && f.middle) {
      return { chord: 'Am', name: 'A Minor', gesture: '✌️ 2 Jari (Peace / V)' };
    }

    // 4. G Major: 3 Jari (Telunjuk + Tengah + Manis 🤟)
    if (f.fingerCount === 3 && f.index && f.middle && f.ring) {
      return { chord: 'G', name: 'G Major', gesture: '🤟 3 Jari (Telunjuk+Tengah+Manis)' };
    }

    // 5. Em (E Minor): 4 Jari (Semua kecuali jempol) ATAU Rock sign (Telunjuk + Kelingking)
    if (f.fingerCount === 4) {
      return { chord: 'Em', name: 'E Minor', gesture: '🖐️ 4 Jari (Tanpa Jempol)' };
    }
    if (f.index && f.pinky && !f.middle && !f.ring) {
      return { chord: 'Em', name: 'E Minor', gesture: '🤘 Rock (Telunjuk+Kelingking)' };
    }

    // 6. F Major: 5 Jari (Telapak Tangan Penuh Terbuka 🖐️)
    if (f.totalCount >= 5) {
      return { chord: 'F', name: 'F Major', gesture: '🖐️ 5 Jari (Telapak Terbuka)' };
    }

    return null;
  }

  // Penstabil chord agar tidak kedip-kedip
  getStableChord(detectedChord) {
    if (detectedChord && detectedChord.chord === this.lastChord) {
      this.stableCount++;
      if (this.stableCount >= this.stabilityThreshold) {
        this.stableChord = detectedChord;
      }
    } else {
      this.lastChord = detectedChord ? detectedChord.chord : null;
      this.stableCount = 1;
      if (!this.stableChord && detectedChord) {
        this.stableChord = detectedChord;
      }
    }
    return this.stableChord;
  }

  // Deteksi Genjrengan Responsif Tangan Kanan
  detectStrum(strumLandmarks, canvasWidth = 640) {
    if (!strumLandmarks || strumLandmarks.length < 21) return null;

    const now = performance.now();
    const indexTip = strumLandmarks[8];
    const wrist = strumLandmarks[0];

    const currentY = (indexTip.y * 0.7 + wrist.y * 0.3);
    const currentX = (indexTip.x * 0.7 + wrist.x * 0.3);

    this.strumHistory.push({ time: now, y: currentY, x: currentX });
    if (this.strumHistory.length > 8) {
      this.strumHistory.shift();
    }

    if (now - this.lastStrumTime < this.strumCooldownMs) {
      return null;
    }

    if (this.strumHistory.length >= 3) {
      const oldest = this.strumHistory[0];
      const newest = this.strumHistory[this.strumHistory.length - 1];
      const deltaY = newest.y - oldest.y;
      const deltaX = newest.x - oldest.x;
      const deltaTime = (newest.time - oldest.time) / 1000;

      const velocityY = deltaTime > 0 ? deltaY / deltaTime : 0;
      const velocityX = deltaTime > 0 ? deltaX / deltaTime : 0;

      // Sensitivitas pas: Ayunan santai vertikal atau horizontal
      const isDown = velocityY > 0.55 || deltaY > 0.06;
      const isUp = velocityY < -0.55 || deltaY < -0.06;
      const isSideSwipe = Math.abs(velocityX) > 0.75 || Math.abs(deltaX) > 0.09;

      if (isDown || isUp || isSideSwipe) {
        this.lastStrumTime = now;
        const direction = isUp ? 'up' : 'down';
        return {
          strummed: true,
          direction: direction,
          speed: Math.max(Math.abs(velocityY), Math.abs(velocityX)),
          x: currentX,
          y: currentY
        };
      }
    }

    return null;
  }
}

window.gestureRecognizer = new GestureRecognizer();
