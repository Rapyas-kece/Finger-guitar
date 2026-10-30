# 🎸 VisionChord

> **AI Hand Gesture Musical Chord Recognition & Virtual Guitar Player**  
> Memindai gerakan sendi jari secara real-time melalui kamera laptop dan membunyikan chord musik harmonis.

---

## ✨ Fitur Utama
1. **Real-time 21 Hand Landmarks Tracking**: Didukung oleh MediaPipe Hands untuk membaca posisi dan sendi jari secara akurat.
2. **Audio Sintesis Akustik (Web Audio API)**: Zero-latency polyphonic acoustic guitar pluck, lengkap dengan simulasi reverb resonansi bodi gitar.
3. **2 Mode Bermain**:
   - **Mode Dua Tangan (Gitar Realistis)**: Tangan kiri membentuk formasi chord, tangan kanan mengayun di atas "Virtual Strumming Zone" untuk memetik dawai!
   - **Mode Satu Tangan (Auto-Play / Hover)**: Cukup bentuk posisi chord di depan kamera, chord akan berbunyi otomatis saat posisi stabil.
4. **Pilihan Karakter Suara**:
   - *Acoustic Guitar*
   - *Electric Clean*
   - *Ambient Synth Pad*
5. **Zero Dependency**: Berjalan langsung di browser Anda tanpa perlu install Node.js, Python, atau paket eksternal apapun.

---

## 🖐️ Kamus Gestur Chord

| Chord | Nama Chord | Gestur Tangan | Keterangan |
| :--- | :--- | :--- | :--- |
| **C** | C Major | ☝️ 1 Jari | Hanya jari telunjuk yang tegak ke atas |
| **Am** | A Minor | ✌️ Peace Sign | Jari telunjuk + jari tengah terbuka |
| **D** | D Major | 🤟 3 Jari | Telunjuk + tengah + jari manis terbuka |
| **Em** | E Minor | 🤘 Rock Horns | Telunjuk + kelingking terbuka (tengah & manis tertekuk) |
| **G** | G Major | 🤙 Shaka / Hang Loose | Ibu jari + kelingking terbuka (3 jari tengah tertekuk) |
| **F** | F Major | 🖐️ Open Palm | Semua 5 jari terbuka lebar |

---

## 🚀 Cara Menjalankan
1. Cukup klik ganda (double click) file **`start.bat`** di folder `D:\vision-chord`.
2. Browser Anda akan terbuka otomatis ke `http://localhost:8080`.
3. Klik tombol **"Nyalakan Kamera"** di pojok kanan atas dan berikan izin akses kamera pada browser.
4. Arahkan tangan Anda ke kamera dan nikmati bermain chord musik!
