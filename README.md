# 🌴 Palm Fruit Ripeness Detector

**AI-powered mobile app untuk mendeteksi tingkat kematangan buah kelapa sawit secara real-time, dari foto ke hasil dalam hitungan detik.**

Proyek portofolio pribadi yang dibangun end-to-end: mulai dari training model computer vision, backend inference API, sampai aplikasi Android yang bisa langsung diinstall dan dicoba. Dibuat untuk menunjukkan kemampuan membangun sistem AI secara menyeluruh — bukan cuma model di notebook, tapi produk yang benar-benar bisa dipakai.

---

## 📱 Demo

<!-- GANTI dengan screenshot/GIF asli kamu -->
| Ambil Foto | Hasil Deteksi |
|---|---|
| ![screenshot 1](docs/screenshot-1.jpg) | ![screenshot 2](docs/screenshot-2.jpg) |

🎥 **[Tonton video demo lengkap →]([GANTI_DENGAN_LINK_VIDEO_KAMU][(https://drive.google.com/file/d/1fVDnAbpmVZWpc3QLzD3fJdvmJ0prPa-r/view?usp=drivesdk)]**

📲 **[Download & install APK →]
[(https://drive.google.com/file/d/139-9yZnYN1tL-onErIbJoYELLpJvbOwc/view?usp=drive_link)]**

---

## 🏆 Hasil

| Metrik | Hasil |
|---|---|
| **Akurasi (Top-1)** | **98.2%** |
| Akurasi (Top-5) | 100% |
| Baseline pembanding* | 75.94% |
| Ukuran model | 5.5 MB (ONNX) |
| Waktu inference | ~13ms/gambar |

<sub>*Baseline dari riset akademik dengan dataset yang sama (InceptionV3 + ANN). Model YOLOv8-cls di proyek ini mengungguli baseline tersebut lebih dari 22 poin.</sub>

---

## 💡 Kenapa Proyek Ini?

Industri agrikultur (termasuk perkebunan sawit) masih banyak mengandalkan penilaian visual manual untuk hal-hal seperti kematangan buah — proses yang lambat, tidak konsisten antar orang, dan sulit di-scale. Proyek ini adalah studi kasus penerapan computer vision untuk membantu penilaian tersebut jadi lebih cepat dan konsisten, sekaligus jadi latihan membangun pipeline AI yang lengkap: dari data mentah, training model, backend production-ready, sampai aplikasi yang benar-benar bisa dipakai end-user di lapangan.

---

## 🏗️ Arsitektur

```
┌─────────────────────┐      foto       ┌──────────────────────┐      inference      ┌─────────────────────┐
│   Android App        │ ───────────────▶ │   Backend API         │ ──────────────────▶ │   Model YOLOv8-cls   │
│  (React Native/Expo) │ ◀─────────────── │  (Node.js + Express)  │ ◀────────────────── │   (ONNX Runtime)      │
└─────────────────────┘   hasil deteksi   └──────────────────────┘      prediksi        └─────────────────────┘
                                                                                                    ▲
                                                                                                    │ trained on
                                                                                          ┌─────────────────────┐
                                                                                          │  Google Colab (GPU)  │
                                                                                          │  Dataset: Kaggle      │
                                                                                          └─────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Tools |
|---|---|
| **Model Training** | Python, YOLOv8 (Ultralytics), Google Colab (GPU) |
| **Model Format** | ONNX |
| **Backend** | Node.js, Express, onnxruntime-node, Sharp |
| **Mobile App** | React Native, Expo, expo-camera |
| **Build & Distribution** | EAS Build (APK) |
| **Dataset** | [Ripeness of Oil Palm Fruit](https://www.kaggle.com/datasets/ramadanizikri112/ripeness-of-oil-palm-fruit) (Kaggle, 3.000 gambar) |

---

## 📂 Struktur Proyek

```
palm-detector/
├── backend/                        # Server Node.js — inference API
│   ├── server.js                   # Endpoint /detect
│   └── model/
│       └── palm_ripeness.onnx      # Model hasil training (5.5MB)
├── mobile/                         # App Android (React Native/Expo)
│   ├── App.js                      # UI kamera + hasil klasifikasi
│   └── eas.json                    # Konfigurasi build APK
└── train_palm_ripeness_colab.ipynb # Notebook training (sudah ada hasil run)
```

---

## ✨ Fitur

- 📷 **Ambil foto langsung** dari kamera atau pilih dari galeri
- 🧠 **Klasifikasi 3 kelas**: unripe (mentah), ripe (matang), overripe (terlalu matang)
- ⚡ **Real-time**: hasil deteksi dalam hitungan detik
- 📊 **Confidence score** untuk setiap prediksi
- 🔌 **Backend terpisah** — model bisa di-scale/deploy independen dari app

---

## 🚀 Menjalankan Proyek Ini

### 1. Training Model (opsional — model sudah tersedia di `backend/model/`)

Buka `train_palm_ripeness_colab.ipynb` di [Google Colab](https://colab.research.google.com) dengan GPU aktif, jalankan semua cell secara berurutan.

### 2. Backend

```bash
cd backend
npm install
node server.js
```

Cek di browser: `http://localhost:3000/health` → harus muncul `{"status":"ok","modelLoaded":true}`

### 3. Mobile App

```bash
cd mobile
npm install
npx expo start
```

Scan QR code dengan aplikasi **Expo Go** di HP Android (pastikan HP & laptop di WiFi yang sama, dan `API_URL` di `App.js` sudah diarahkan ke IP lokal laptop).

### 4. Build APK Sendiri

```bash
cd mobile
npx eas build -p android --profile preview
```

---

## 🧩 Tantangan & Solusi

Beberapa tantangan teknis nyata yang dihadapi & diselesaikan selama pengembangan:

- **Format dataset tidak sesuai asumsi awal** — dataset Kaggle ternyata berformat klasifikasi (folder per kelas), bukan object detection dengan bounding box. Solusi: beralih dari YOLOv8 *detection* mode ke *classification* mode (`yolov8n-cls`), yang justru lebih sesuai untuk kasus 1 foto = 1 label.
- **Nama folder dataset dalam Bahasa Indonesia** (`Belum Masak`, `Masak`, `Terlalu Masak`) — dibuat mapping otomatis ke label Inggris standar (`unripe`/`ripe`/`overripe`) di notebook training.
- **Expo SDK version mismatch** — project awal menggunakan SDK terbaru yang belum stabil didukung Expo Go di Play Store. Solusi: downgrade terkontrol ke SDK 54 (versi stabil terkonfirmasi).
- **Kondisi lapangan minim sinyal** — untuk implementasi nyata di kebun, desain backend-based ini punya keterbatasan konektivitas. Arsitektur bisa di-upgrade ke on-device inference (TFLite) atau offline-first queue untuk skenario tanpa sinyal.

---

## 🔮 Pengembangan Selanjutnya

- [ ] On-device inference (TFLite) untuk penggunaan offline penuh di lapangan
- [ ] Offline queue + auto-sync untuk kondisi minim sinyal
- [ ] Dataset lebih besar & beragam (kondisi pencahayaan, sudut foto berbeda)
- [ ] Deploy backend ke hosting permanen (Render/Railway)

---

## 👤 Kontak

**Ariko Yahya Setyawan**
📧 arikosetyawan00@gmail.com
🔗 [LinkedIn](https://linkedin.com/in/ariko-yahya-setyawan) · [Portfolio](https://arikosetyawan00.github.io)

---

<sub>Dibuat sebagai proyek portofolio pribadi. Dataset digunakan untuk keperluan riset/edukasi non-komersial.</sub>
