const express = require("express");
const multer = require("multer");
const cors = require("cors");
const sharp = require("sharp");
const ort = require("onnxruntime-node");
const path = require("path");

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

// ---- CONFIG ----
const MODEL_PATH = path.join(__dirname, "model", "palm_ripeness.onnx");
const INPUT_SIZE = 224; // sesuai ukuran gambar dataset & training (imgsz=224)

// Urutan ini HARUS sama persis dengan urutan folder kelas saat training
// (ikuti urutan alfabetis yang dipakai Ultralytics: overripe, ripe, unripe)
const CLASS_NAMES = ["overripe", "ripe", "unripe"];

let session = null;

async function loadModel() {
  try {
    session = await ort.InferenceSession.create(MODEL_PATH);
    console.log("✅ Model loaded:", MODEL_PATH);
  } catch (err) {
    console.warn(
      "⚠️  Model belum ditemukan di:",
      MODEL_PATH,
      "\n   Server tetap jalan, tapi endpoint /detect akan error sampai model di-export dari Colab dan diletakkan di folder ini."
    );
  }
}
loadModel();

// Preprocess: resize gambar ke 224x224, normalize ke 0-1, convert ke tensor NCHW
async function preprocessImage(buffer) {
  const { data, info } = await sharp(buffer)
    .resize(INPUT_SIZE, INPUT_SIZE, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info; // channels harus 3 (RGB)
  const floatData = new Float32Array(channels * width * height);

  // HWC -> CHW, normalize 0-255 ke 0-1
  for (let c = 0; c < channels; c++) {
    for (let h = 0; h < height; h++) {
      for (let w = 0; w < width; w++) {
        const srcIdx = (h * width + w) * channels + c;
        const dstIdx = c * width * height + h * width + w;
        floatData[dstIdx] = data[srcIdx] / 255.0;
      }
    }
  }

  return new ort.Tensor("float32", floatData, [1, channels, height, width]);
}

// Output classification YOLOv8-cls: 1 vector probabilitas per kelas (softmax)
// Beda dari detection - nggak ada bounding box, cuma 1 label untuk seluruh gambar
function postprocessClassification(outputTensor) {
  const data = outputTensor.data;

  const scored = Array.from(data).map((score, i) => ({
    label: CLASS_NAMES[i] || `class_${i}`,
    confidence: Number(score.toFixed(3)),
  }));

  scored.sort((a, b) => b.confidence - a.confidence);
  return scored; // hasil paling tinggi di index 0 = prediksi utama
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", modelLoaded: !!session });
});

app.post("/detect", upload.single("image"), async (req, res) => {
  try {
    if (!session) {
      return res.status(503).json({
        error:
          "Model belum di-load. Pastikan file palm_ripeness.onnx sudah diletakkan di folder backend/model/.",
      });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Tidak ada gambar dikirim. Gunakan field 'image'." });
    }

    const inputTensor = await preprocessImage(req.file.buffer);

    const inputName = session.inputNames[0];
    const outputName = session.outputNames[0];
    const feeds = { [inputName]: inputTensor };

    const outputMap = await session.run(feeds);
    const output = outputMap[outputName];

    const predictions = postprocessClassification(output);

    // "detections" tetap dipakai sebagai nama field supaya app mobile tidak perlu diubah,
    // tapi isinya sekarang ranking klasifikasi, bukan bounding box per objek
    res.json({ detections: predictions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memproses gambar", detail: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Palm Ripeness Detector backend jalan di http://localhost:${PORT}`);
});
