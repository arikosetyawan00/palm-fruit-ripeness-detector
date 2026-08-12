# 🌴 Palm Fruit Ripeness Detector

Aplikasi Android untuk deteksi tingkat kematangan buah sawit menggunakan YOLOv8 (Computer Vision), dengan backend Node.js dan frontend React Native (Expo).

Dibuat sebagai portofolio untuk lamaran **AI Development Intern (OPTRA) — PT SMART Tbk**.

## Arsitektur

```
[HP Android - React Native/Expo]
        |  (foto/upload gambar)
        v
[Backend Node.js + Express]
        |  (jalankan model ONNX)
        v
[Model YOLOv8 hasil training di Colab]
```

## Struktur Folder

```
palm-detector/
├── backend/                        # Server Node.js
│   ├── server.js                   # API endpoint /detect
│   ├── model/                      # Taruh palm_ripeness.onnx di sini
│   └── package.json
├── mobile/                         # App React Native (Expo)
│   └── App.js                      # UI kamera + hasil deteksi
└── train_palm_ripeness_colab.ipynb # Notebook training model (jalankan di Colab)
```

## Langkah Menjalankan Project

### 1. Training Model (Google Colab)

Dataset yang dipakai: [ripeness-of-oil-palm-fruit](https://www.kaggle.com/datasets/ramadanizikri112/ripeness-of-oil-palm-fruit) (3.000 gambar, 3 kelas: unripe/ripe/overripe, 224x224px). Ini dataset **classification** (bukan object detection), jadi notebook sudah disesuaikan pakai `yolov8n-cls`.

1. Upload `train_palm_ripeness_colab.ipynb` ke [Google Colab](https://colab.research.google.com)
2. Runtime > Change runtime type > pilih **GPU**
3. Jalankan semua cell satu per satu (ikuti instruksi di tiap cell) — dataset otomatis didownload dari Kaggle via API
4. Setelah selesai, file `palm_ripeness.onnx` akan otomatis terdownload
5. Sebagai pembanding: riset dengan dataset yang sama (InceptionV3 + ANN) dapat akurasi 75.94% — jadikan ini baseline target

### 2. Setup Backend

```bash
cd backend
npm install
```

Taruh file `palm_ripeness.onnx` yang sudah didownload dari Colab ke folder `backend/model/`.

`CLASS_NAMES` di `server.js` sudah diatur `["overripe", "ripe", "unripe"]` (urutan alfabetis, sesuai cara Ultralytics menyusun folder kelas otomatis). Kalau setelah training ternyata urutannya beda, cek dengan print `model.names` di Colab lalu sesuaikan urutan di `server.js`.

Jalankan server:
```bash
node server.js
```

Server akan jalan di `http://localhost:3000`. Test dengan buka `http://localhost:3000/health` di browser — harus muncul `{"status":"ok","modelLoaded":true}`.

### 3. Setup Mobile App

```bash
cd mobile
npm install
```

**Penting:** buka `App.js`, ganti `API_URL` dari `http://localhost:3000` ke IP lokal laptop kamu (misal `http://192.168.1.5:3000`) supaya HP bisa akses backend saat development. Cara cek IP laptop: `ipconfig` (Windows) atau `ifconfig` (Mac/Linux).

Jalankan:
```bash
npx expo start
```

Scan QR code yang muncul pakai aplikasi **Expo Go** di HP Android kamu.

### 4. Deploy Backend ke Production (Gratis)

1. Push folder `backend/` ke repo GitHub
2. Daftar di [Render.com](https://render.com) (gratis, tanpa kartu kredit)
3. New > Web Service > connect ke repo GitHub kamu
4. Set start command: `node server.js`
5. Upload juga file model ONNX-nya (atau host terpisah, karena ukurannya bisa besar — lihat catatan di bawah)
6. Setelah deploy, ganti `API_URL` di `App.js` dengan URL Render kamu (misal `https://palm-detector-backend.onrender.com`)

### 5. Build APK untuk Portofolio

```bash
cd mobile
npx eas login
npx eas build -p android --profile preview
```

Setelah selesai, kamu dapat link download `.apk`. Upload ke GitHub Releases di repo kamu, dan cantumkan link-nya di README supaya recruiter bisa langsung install & coba.

## Catatan Penting

- **Model ONNX bisa berukuran besar** (puluhan MB). Kalau terlalu besar untuk di-commit ke GitHub biasa, pertimbangkan pakai Git LFS, atau host modelnya terpisah (misal Hugging Face Hub) dan download saat server start.
- **Free tier Render "tidur"** setelah 15 menit nganggur — request pertama ke API akan lambat (~30-60 detik). Ini normal, sudah dikasih tau di UI app-nya ("backend gratis bisa lambat...").
- Kalau dataset sawit spesifik susah dicari di Kaggle, boleh mulai dengan dataset fruit ripeness umum dulu untuk buktikan pipeline-nya jalan end-to-end, baru nanti diganti/fine-tune dengan data sawit kalau dapat.
- Model ini adalah **classification** (1 gambar = 1 prediksi kematangan keseluruhan), bukan object detection dengan bounding box. Jadi cocok untuk foto 1 buah/tandan yang di-crop cukup dekat — bukan untuk mendeteksi banyak buah sekaligus dalam 1 foto lebar. Kalau nanti mau upgrade ke deteksi multi-objek per foto, itu perlu dataset dengan anotasi bounding box terpisah (beda dari dataset Kaggle yang dipakai sekarang).

## Untuk Portofolio

Setelah semua jalan, dokumentasikan di README ini atau di GitHub repo terpisah:
- Screenshot/video demo aplikasi
- Metrics hasil training (akurasi/mAP dari Colab)
- Link APK download
- Penjelasan singkat arsitektur (bisa pakai diagram di atas)
