/**
 * VisionChord - Controller & Real-Time Smooth Canvas Engine
 * Dedicated: Tangan Kiri = Chord, Tangan Kanan = Genjrengan (Gitar Klasik)
 */

document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('webcam');
  const canvas = document.getElementById('canvas-overlay');
  const ctx = canvas.getContext('2d');

  const btnToggleCam = document.getElementById('btn-toggle-cam');
  const placeholder = document.getElementById('placeholder');
  const camStatusDot = document.getElementById('cam-status-dot');
  const camStatusText = document.getElementById('cam-status-text');
  const handsStatusBadge = document.getElementById('hands-status-badge');
  const handsDetectedText = document.getElementById('hands-detected-text');

  const chordHero = document.getElementById('chord-hero');
  const heroChordLetter = document.getElementById('hero-chord-letter');
  const heroChordName = document.getElementById('hero-chord-name');
  const heroChordNotes = document.getElementById('hero-chord-notes');
  const heroTriggerBadge = document.getElementById('hero-trigger-badge');
  const heroGestureHint = document.getElementById('hero-gesture-hint');

  const volumeRange = document.getElementById('volume-range');
  const chordCards = document.querySelectorAll('.chord-item');

  let camera = null;
  let hands = null;
  let isCameraRunning = false;
  let activeChord = 'C'; // Default C
  let stringVibration = 0; // Animasi getaran senar

  // 6 Dawai Virtual Gitar Klasik (E, A, D, G, B, E)
  const virtualStrings = [
    { name: '6-E', offset: -35, color: '#f87171', thick: 3.5 },
    { name: '5-A', offset: -21, color: '#fb923c', thick: 3.0 },
    { name: '4-D', offset: -7,  color: '#facc15', thick: 2.5 },
    { name: '3-G', offset: 7,   color: '#4ade80', thick: 2.0 },
    { name: '2-B', offset: 21,  color: '#38bdf8', thick: 1.8 },
    { name: '1-E', offset: 35,  color: '#a78bfa', thick: 1.5 }
  ];

  // Volume
  if (volumeRange) {
    volumeRange.addEventListener('input', (e) => {
      soundEngine.setVolume(parseFloat(e.target.value));
    });
  }

  // Klik manual kartu chord untuk tes suara gitar klasik
  chordCards.forEach(card => {
    card.addEventListener('click', () => {
      soundEngine.init();
      const chordKey = card.getAttribute('data-chord');
      activeChord = chordKey;
      triggerChord(chordKey, 'down', 'Manual Tes');
    });
  });

  // Bunyikan chord gitar klasik + efek getaran senar
  function triggerChord(chordKey, direction = 'down', source = 'Genjreng') {
    if (!chordKey) return;
    const chordInfo = soundEngine.playChord(chordKey, direction);
    if (!chordInfo) return;

    stringVibration = 1.0;

    // Tampilkan di Hero UI
    chordHero.style.display = 'flex';
    heroChordLetter.textContent = chordInfo.tag;
    heroChordLetter.style.color = chordInfo.color;
    heroChordName.textContent = chordInfo.name;
    heroTriggerBadge.textContent = `${source} (${direction === 'down' ? 'Bawah ↓' : 'Atas ↑'})`;
    heroTriggerBadge.style.color = chordInfo.color;
    heroTriggerBadge.style.borderColor = chordInfo.color;

    heroChordNotes.innerHTML = '';
    chordInfo.names.forEach(n => {
      const chip = document.createElement('span');
      chip.className = 'note-chip';
      chip.textContent = n;
      heroChordNotes.appendChild(chip);
    });

    // Animasi kartu hero
    chordHero.classList.remove('strum-animate');
    void chordHero.offsetWidth;
    chordHero.classList.add('strum-animate');

    // Highlight sidebar
    chordCards.forEach(c => {
      if (c.getAttribute('data-chord') === chordKey) {
        c.classList.add('active');
        setTimeout(() => c.classList.remove('active'), 400);
      }
    });
  }

  // Gambar Skeleton Jari yang Halus (Smooth Anti-Goyang)
  function drawSmoothSkeleton(landmarks, isChordHand) {
    const connections = [
      [0,1],[1,2],[2,3],[3,4],        // Ibu Jari
      [0,5],[5,6],[6,7],[7,8],        // Telunjuk
      [5,9],[9,10],[10,11],[11,12],   // Tengah
      [9,13],[13,14],[14,15],[15,16], // Manis
      [13,17],[17,18],[18,19],[19,20],[0,17] // Kelingking & Telapak
    ];

    const colorPrimary = isChordHand ? '#38bdf8' : '#4ade80';
    const colorLine = isChordHand ? 'rgba(56, 189, 248, 0.75)' : 'rgba(74, 222, 128, 0.75)';

    ctx.save();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = colorLine;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Garis sendi
    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      ctx.beginPath();
      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
      ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
      ctx.stroke();
    });

    // Titik sendi jari neon
    landmarks.forEach((p, idx) => {
      const x = p.x * canvas.width;
      const y = p.y * canvas.height;
      const isTip = [4, 8, 12, 16, 20].includes(idx);

      ctx.beginPath();
      ctx.arc(x, y, isTip ? 6.5 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = isTip ? '#ffffff' : colorPrimary;
      ctx.shadowColor = colorPrimary;
      ctx.shadowBlur = isTip ? 12 : 4;
      ctx.fill();
    });

    // Tanda Pick Neon pada Tangan Kanan (Pemetik/Genjreng)
    if (!isChordHand) {
      const pick = landmarks[8]; // Ujung telunjuk
      const px = pick.x * canvas.width;
      const py = pick.y * canvas.height;

      ctx.beginPath();
      ctx.moveTo(px, py - 14);
      ctx.lineTo(px + 12, py + 12);
      ctx.lineTo(px - 12, py + 12);
      ctx.closePath();
      ctx.fillStyle = '#4ade80';
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 18;
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.font = 'bold 13px system-ui';
      ctx.fillStyle = '#4ade80';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ PICK GENJRENG', px, py - 20);
    } else {
      // Label Tangan Kiri Chord
      const wrist = landmarks[0];
      const wx = wrist.x * canvas.width;
      const wy = wrist.y * canvas.height;

      ctx.shadowBlur = 0;
      ctx.font = 'bold 12px system-ui';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText('🎸 TANGAN CHORD', wx, wy + 25);
    }

    ctx.restore();
  }

  // Gambar Garis Dawai Gitar Virtual
  function drawVirtualStrings() {
    // Sisi kanan layar (area tangan kanan menggenjreng)
    const stringCenterX = canvas.width * 0.78;
    ctx.save();

    // Background Zona Dawai
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.fillRect(stringCenterX - 60, 0, 120, canvas.height);

    // Header Zona Strum
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('DAWAI GITAR (GENJRENG DI SINI)', stringCenterX, 28);

    // 6 Dawai Gitar Klasik dengan getaran natural
    virtualStrings.forEach((s) => {
      const baseX = stringCenterX + s.offset;
      const vib = stringVibration > 0 ? (Math.sin(Date.now() / 20 + s.offset) * 5 * stringVibration) : 0;
      const finalX = baseX + vib;

      ctx.beginPath();
      ctx.moveTo(finalX, 38);
      ctx.lineTo(finalX, canvas.height - 25);
      ctx.strokeStyle = stringVibration > 0 ? s.color : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = s.thick + (stringVibration > 0 ? 1.5 : 0);
      ctx.shadowColor = s.color;
      ctx.shadowBlur = stringVibration > 0 ? 12 : 0;
      ctx.stroke();

      // Label senar
      ctx.shadowBlur = 0;
      ctx.fillStyle = s.color;
      ctx.font = 'bold 10px monospace';
      ctx.fillText(s.name, finalX, canvas.height - 10);
    });

    if (stringVibration > 0) {
      stringVibration -= 0.035;
      if (stringVibration < 0) stringVibration = 0;
    }

    ctx.restore();
  }

  // Pipeline Frame MediaPipe
  function onResults(results) {
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const numHands = results.multiHandLandmarks ? results.multiHandLandmarks.length : 0;
    handsStatusBadge.style.display = 'flex';
    handsDetectedText.textContent = `${numHands} Tangan Terdeteksi`;

    // Gambar dawai gitar virtual
    drawVirtualStrings();

    if (numHands === 0) {
      heroGestureHint.textContent = 'Arahkan tangan kiri (chord) & kanan (genjreng)...';
      return;
    }

    let chordHand = null;
    let strumHand = null;

    if (numHands === 1) {
      // 1 Tangan terdeteksi: Tentukan peran berdasarkan posisi layar
      // Sumbu X pada mirror: < 0.5 = Kiri (Chord), >= 0.5 = Kanan (Strum)
      const hand = results.multiHandLandmarks[0];
      const isLeftArea = hand[0].x > 0.5; // Pada raw video yang di-mirror, raw x > 0.5 berada di kiri pengguna

      if (isLeftArea) {
        chordHand = gestureRecognizer.smoothLandmarks('left', hand);
      } else {
        strumHand = gestureRecognizer.smoothLandmarks('right', hand);
      }
    } else {
      // 2 Tangan terdeteksi: Pisahkan tegas Tangan Kiri (Chord) dan Tangan Kanan (Genjreng)
      const handA = results.multiHandLandmarks[0];
      const handB = results.multiHandLandmarks[1];

      // Di kamera mirror, tangan kiri pengguna memiliki nilai raw X yang lebih besar
      if (handA[0].x > handB[0].x) {
        chordHand = gestureRecognizer.smoothLandmarks('left', handA);
        strumHand = gestureRecognizer.smoothLandmarks('right', handB);
      } else {
        chordHand = gestureRecognizer.smoothLandmarks('left', handB);
        strumHand = gestureRecognizer.smoothLandmarks('right', handA);
      }
    }

    // 1. Proses TANGAN KIRI (CHORD)
    if (chordHand) {
      drawSmoothSkeleton(chordHand, true);
      const rawChord = gestureRecognizer.identifyChord(chordHand);
      const stable = gestureRecognizer.getStableChord(rawChord);

      if (stable) {
        activeChord = stable.chord;
        chordHero.style.display = 'flex';
        heroChordLetter.textContent = stable.chord;
        heroChordLetter.style.color = soundEngine.chords[stable.chord].color;
        heroChordName.textContent = stable.name;
        heroGestureHint.textContent = `Chord: ${stable.name} (${stable.gesture})`;
      } else {
        heroGestureHint.textContent = 'Tunjukkan jari chord (1-5 jari)...';
      }
    }

    // 2. Proses TANGAN KANAN (GENJRENGAN)
    if (strumHand) {
      drawSmoothSkeleton(strumHand, false);
      const strum = gestureRecognizer.detectStrum(strumHand, canvas.width);

      if (strum) {
        // Genjreng langsung chord aktif
        triggerChord(activeChord, strum.direction, 'Genjrengan Klasik');
      }
    } else if (numHands === 1 && chordHand) {
      heroGestureHint.textContent = 'Chord siap! Angkat tangan kanan untuk genjreng.';
    }
  }

  // Nyalakan / Matikan Kamera
  async function toggleCamera() {
    if (isCameraRunning) {
      if (camera) camera.stop();
      isCameraRunning = false;
      btnToggleCam.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
        <span>Nyalakan Kamera</span>
      `;
      btnToggleCam.classList.remove('active');
      video.style.display = 'none';
      placeholder.style.display = 'flex';
      camStatusDot.classList.remove('active');
      camStatusText.textContent = 'Kamera Dimatikan';
      handsStatusBadge.style.display = 'none';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    try {
      soundEngine.init(); // Aktifkan Web Audio Context
      camStatusText.textContent = 'Menyiapkan AI MediaPipe...';

      if (!hands) {
        hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.60,
          minTrackingConfidence: 0.60
        });

        hands.onResults(onResults);
      }

      camera = new Camera(video, {
        onFrame: async () => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            await hands.send({ image: video });
          }
        },
        width: 1280,
        height: 720
      });

      await camera.start();
      isCameraRunning = true;

      btnToggleCam.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        </svg>
        <span>Hentikan Kamera</span>
      `;
      btnToggleCam.classList.add('active');
      video.style.display = 'block';
      placeholder.style.display = 'none';
      camStatusDot.classList.add('active');
      camStatusText.textContent = 'Kamera Aktif & Siap Main';
    } catch (err) {
      console.error('Camera Error:', err);
      camStatusText.textContent = 'Gagal Akses Kamera';
      alert('Gagal mengakses kamera laptop. Pastikan izin kamera aktif di browser!');
    }
  }

  btnToggleCam.addEventListener('click', toggleCamera);
});
