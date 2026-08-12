import { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

// GANTI dengan URL backend kamu setelah di-deploy (Render/Railway),
// atau IP lokal laptop kamu (mis. http://192.168.1.5:3000) saat masih development
const API_URL = "http://192.168.1.4:3000";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [detections, setDetections] = useState(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Izin ditolak", "Aplikasi butuh akses kamera untuk deteksi.");
        return;
      }
    }
    setShowCamera(true);
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    const result = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    setShowCamera(false);
    setPhoto(result.uri);
    detectImage(result.uri);
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setPhoto(uri);
      detectImage(uri);
    }
  };

  const detectImage = async (uri) => {
    setLoading(true);
    setDetections(null);
    try {
      const formData = new FormData();
      formData.append("image", {
        uri,
        name: "photo.jpg",
        type: "image/jpeg",
      });

      const res = await fetch(`${API_URL}/detect`, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal deteksi");
      setDetections(data.detections);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showCamera) {
    return (
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowCamera(false)}
          >
            <Text style={styles.cancelText}>Batal</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>🌴 Palm Fruit Ripeness Detector</Text>
      <Text style={styles.subtitle}>
        Foto tandan buah sawit untuk cek tingkat kematangan
      </Text>

      {photo && <Image source={{ uri: photo }} style={styles.preview} />}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={openCamera}>
          <Text style={styles.buttonText}>📷 Ambil Foto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={pickFromGallery}>
          <Text style={styles.buttonText}>🖼️ Pilih dari Galeri</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>
            Menganalisis gambar... (backend gratis bisa lambat di request pertama)
          </Text>
        </View>
      )}

      {detections && (
        <View style={styles.resultsBox}>
          <Text style={styles.resultsTitle}>Hasil Klasifikasi:</Text>
          {detections.length === 0 && (
            <Text style={styles.noResult}>Gagal membaca hasil.</Text>
          )}
          {detections.map((d, i) => (
            <View
              key={i}
              style={[styles.resultItem, i === 0 && styles.resultItemTop]}
            >
              <Text style={styles.resultLabel}>
                {i === 0 ? "🏆 " : ""}
                {labelEmoji(d.label)} {d.label.toUpperCase()}
                {i === 0 ? " (prediksi utama)" : ""}
              </Text>
              <Text style={styles.resultConfidence}>
                Confidence: {(d.confidence * 100).toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function labelEmoji(label) {
  if (label === "ripe") return "✅";
  if (label === "unripe") return "🟢";
  if (label === "overripe") return "⚠️";
  return "🔍";
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  preview: {
    width: 280,
    height: 280,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#eee",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#2E7D32",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  buttonSecondary: {
    backgroundColor: "#558B2F",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingBox: {
    marginTop: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    textAlign: "center",
    fontSize: 12,
  },
  resultsBox: {
    marginTop: 20,
    width: "100%",
    backgroundColor: "#F1F8E9",
    borderRadius: 12,
    padding: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  resultItem: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  resultItemTop: {
    backgroundColor: "#DCEDC8",
    borderWidth: 1,
    borderColor: "#7CB342",
  },
  resultLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  resultConfidence: {
    fontSize: 13,
    color: "#666",
  },
  noResult: {
    color: "#888",
    fontStyle: "italic",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  cameraControls: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#2E7D32",
  },
  cancelButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  cancelText: {
    color: "#fff",
  },
});
