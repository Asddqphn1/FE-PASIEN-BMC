import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { FontAwesome, Ionicons, Feather } from "@expo/vector-icons";
import { useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";

// === TEMA WARNA ===
const THEME = {
  active: "#29B6F6",
  danger: "#E53935",
  success: "#2E7D32",
  warning: "#FFB300",
  textMain: "#263238",
  card: "#FFFFFF",
};

// === CUSTOM MODAL BARU ===
const CustomAlertModal = ({ visible, title, message, type, onClose }) => {
  const getConfig = () => {
    switch (type) {
      case "error":
      case "danger":
        return { icon: "alert-circle", color: "#FF5252", bgColor: "#FFEBEE" };
      case "success":
        return { icon: "check-circle", color: "#4CAF50", bgColor: "#E8F5E9" };
      case "info":
      default:
        return { icon: "info", color: "#2196F3", bgColor: "#E3F2FD" };
    }
  };

  const config = getConfig();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.alertBox}>
          <View
            style={[
              modalStyles.iconContainer,
              { backgroundColor: config.bgColor },
            ]}
          >
            <Feather name={config.icon} size={40} color={config.color} />
          </View>
          <Text style={modalStyles.title}>{title}</Text>
          <Text style={modalStyles.message}>{message}</Text>
          <TouchableOpacity
            style={[modalStyles.button, { backgroundColor: config.color }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={modalStyles.buttonText}>Mengerti, Bunda</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const navigate = useNavigate();

  const showAlert = (title, message, type = "info") => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  const handleLogin = async () => {
    if (!username || !password) {
      showAlert(
        "Data Belum Lengkap",
        "Username dan Password tidak boleh kosong.",
        "danger"
      );
      return;
    }
    setIsLoading(true);
    try {
      // 1. REQUEST LOGIN
      const response = await fetch(
        `https://restful-api-bmc-production-v2.up.railway.app/api/login-pasien`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ username, password }),
        }
      );
      const data = await response.json();

      if (!response.ok)
        throw new Error(data.message || "Username atau Password salah.");
      if (!data.token) throw new Error("Token tidak diterima dari server.");

      // 2. FETCH DATA PASIEN LENGKAP (Untuk cek status persalinan)
      // Kita butuh No REG untuk hit endpoint getData
      const noReg = data.pasien?.no_reg;

      if (noReg) {
        const detailResponse = await fetch(
          `https://restful-api-bmc-production-v2.up.railway.app/api/pasien/${noReg}/getData`,
          {
            headers: { Authorization: `Bearer ${data.token}` },
          }
        );
        const detailData = await detailResponse.json();

        // Simpan Profile lengkap (termasuk array persalinan) ke storage
        if (detailData.data) {
          await AsyncStorage.setItem(
            "userProfile",
            JSON.stringify(detailData.data)
          );
        }
      }

      // Simpan Token
      await AsyncStorage.setItem("userToken", data.token);

      setIsLoading(false);
      showAlert(
        "Login Berhasil",
        "Selamat datang kembali di Ruang Bunda.",
        "success"
      );

      setTimeout(() => {
        closeAlert();
        navigate("/home");
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      showAlert("Gagal Masuk", error.message, "danger");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={closeAlert}
      />

      <View style={styles.header}>
        <Image source={require("../../assets/Logo.png")} style={styles.logo} />
        <View style={styles.textBlock}>
          <Text style={styles.title}>Ruang</Text>
          <Text style={styles.subtitle}>Bunda</Text>
        </View>
      </View>

      <View style={styles.imageWrapper}>
        <Image
          source={require("../../assets/ibu-hamil.png")}
          style={styles.doctorImage}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <BlurView intensity={80} tint="light" style={styles.loginCard}>
          <Text style={styles.loginTitle}>Login</Text>

          <Text style={styles.label}>Username:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#ddd"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <FontAwesome name="user" size={18} color="#fff" />
          </View>

          <Text style={styles.label}>Password:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#ddd"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <FontAwesome
                name={showPassword ? "eye-slash" : "eye"}
                size={18}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>
        </BlurView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F6F2" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 50,
    marginLeft: 20,
    position: "absolute",
    top: 0,
    zIndex: 20,
  },
  logo: { width: 50, height: 50, marginRight: 8 },
  textBlock: { flexDirection: "column" },
  title: { fontSize: 20, fontWeight: "bold" },
  subtitle: { fontSize: 20, fontWeight: "bold", color: "#2196F3" },
  imageWrapper: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  doctorImage: { width: "100%", height: 400, resizeMode: "contain" },
  scrollContent: { flexGrow: 1, justifyContent: "flex-end" },
  loginCard: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingVertical: 50,
    paddingHorizontal: 30,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  loginTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  label: { alignSelf: "flex-start", marginTop: 15, fontWeight: "600" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(68, 138, 255, 0.7)",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginTop: 8,
    width: "100%",
    height: 48,
  },
  input: { flex: 1, color: "#fff", paddingRight: 10 },
  loginButton: {
    backgroundColor: "#2196F3",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 50,
    marginTop: 30,
  },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 20,
  },
  alertBox: {
    width: "100%",
    backgroundColor: THEME.card,
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: THEME.textMain,
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: THEME.textMain,
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
});
