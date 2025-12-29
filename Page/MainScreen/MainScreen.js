import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Easing,
  TouchableOpacity,
  Vibration,
  Modal,
  Linking,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  COLORS,
  BASE_URL_PATIENT,
  getTokenFromStorage,
  decodeJwtPayload,
  cleanNumberString,
  getDjjStatus,
  getDilatationPhase,
  getLatestFilledPartografData,
  SHADOW_STYLE,
} from "../../utils/global";

import HeaderTop from "../../components/HeaderTop";
import HeaderGradient from "../../components/HeaderGradient";
import MidwifeCard from "../../components/MidwifeCard";
import DilatationVisualizer from "../../components/DilatationVisualizer";
import DjjStatusCard from "../../components/DjjStatusCard";
import IbuStatusCard from "../../components/IbuStatusCard";
import BottomTabBar from "../../components/BottomTabBar";

// ==========================================
// 0. COMPONENT ALERT MODERN
// ==========================================
const ModernAlert = ({ visible, title, message, type, actions }) => {
  if (!visible) return null;
  let iconName = "alert-circle";
  let color = COLORS.primaryBlue;

  if (type === "success") {
    iconName = "checkmark-circle";
    color = COLORS.accentSuccess;
  } else if (type === "error") {
    iconName = "warning";
    color = COLORS.accentError;
  }

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Ionicons name={iconName} size={60} color={color} />
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalActions}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalBtn,
                  action.style === "cancel"
                    ? styles.modalBtnCancel
                    : { backgroundColor: color },
                ]}
                onPress={action.onPress}
              >
                <Text
                  style={[
                    styles.modalBtnText,
                    action.style === "cancel"
                      ? { color: COLORS.textSecondary }
                      : { color: "white" },
                  ]}
                >
                  {action.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ==========================================
// 0.1 PANIC CONFIRM MODAL (FIXED)
// ==========================================
const PanicConfirmModal = ({ visible, onCancel, onConfirm }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.card}>
          <View style={modalStyles.iconWrap}>
            <Ionicons name="alert-circle" size={40} color="#D32F2F" />
          </View>

          <Text style={modalStyles.title}>Konfirmasi Darurat</Text>

          <Text style={modalStyles.desc}>
            Tindakan ini akan mengirim sinyal darurat ke bidan.
            {"\n\n"}
            Gunakan hanya jika Bunda mengalami kondisi gawat atau membutuhkan
            bantuan segera.
          </Text>

          <View style={modalStyles.actions}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onCancel}>
              <Text style={modalStyles.cancelText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={modalStyles.confirmBtn}
              onPress={onConfirm}
            >
              <Text style={modalStyles.confirmText}>Ya, Panggil Bidan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ==========================================
// 1. COMPONENT: BABY BORN CARD
// ==========================================
const BabyBornCard = ({ babyData, ibuName }) => {
  if (!babyData) return null;

  const birthDate = new Date(babyData.tanggal_jam_waktu_bayi_lahir);
  const dateStr = birthDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = birthDate.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isGirl = babyData.jenis_kelamin?.toLowerCase() === "perempuan";
  const themeColor = isGirl ? "#F48FB1" : "#42A5F5";

  return (
    <View style={styles.bornContainer}>
      <View style={[styles.bornHeader, { backgroundColor: themeColor }]}>
        <Text style={styles.bornTitle}>Alhamdulillah!</Text>
        <Text style={styles.bornSubtitle}>Selamat Bunda {ibuName}</Text>
      </View>

      <View style={styles.bornBody}>
        <View style={styles.bornIconWrapper}>
          <FontAwesome5 name="baby" size={60} color={themeColor} />
          <View style={styles.confettiIcon}>
            <MaterialCommunityIcons
              name="party-popper"
              size={30}
              color="#FFD700"
            />
          </View>
        </View>

        <Text style={styles.bornMessage}>
          Buah hati tercinta telah lahir dengan selamat dan sehat.
        </Text>

        <View style={styles.bornDivider} />

        <View style={styles.bornGrid}>
          <View style={styles.bornItem}>
            <MaterialCommunityIcons
              name="gender-male-female"
              size={24}
              color="#555"
            />
            <Text style={styles.bornLabel}>Jenis Kelamin</Text>
            <Text style={[styles.bornValue, { color: themeColor }]}>
              {babyData.jenis_kelamin || "-"}
            </Text>
          </View>

          <View style={styles.bornItem}>
            <MaterialCommunityIcons name="weight" size={24} color="#555" />
            <Text style={styles.bornLabel}>Berat Badan</Text>
            <Text style={styles.bornValue}>{babyData.berat_badan} kg</Text>
          </View>

          <View style={styles.bornItem}>
            <MaterialCommunityIcons name="ruler" size={24} color="#555" />
            <Text style={styles.bornLabel}>Panjang</Text>
            <Text style={styles.bornValue}>{babyData.panjang_badan} cm</Text>
          </View>

          <View style={styles.bornItem}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={24}
              color="#555"
            />
            <Text style={styles.bornLabel}>Waktu Lahir</Text>
            <Text style={styles.bornValue}>{timeStr}</Text>
          </View>
        </View>
        <Text style={styles.bornDate}>{dateStr}</Text>
      </View>
    </View>
  );
};

// ==========================================
// 2. COMPONENT: REFERRAL CARD (RUJUKAN)
// ==========================================
const ReferralCard = ({ alasanRujukan, bidanName }) => {
  // DATA STATIS RS
  const RS_INFO = {
    nama: "Rumah Sakit Tentara Pekanbaru",
    alamat:
      "Jl. Kesehatan No.2, RT.01/RW.06, Kp. Bandar, Kec. Senapelan, Kota Pekanbaru, Riau 28155",
    mapsUrl: "https://maps.google.com/?q=Rumah+Sakit+Tentara+Pekanbaru",
  };

  const openMaps = () => {
    Linking.openURL(RS_INFO.mapsUrl).catch((err) =>
      console.error("Couldn't load page", err)
    );
  };

  return (
    <View style={styles.referralContainer}>
      {/* Header Rujukan */}
      <View style={styles.referralHeader}>
        <View style={styles.referralIconPulse}>
          <FontAwesome5 name="ambulance" size={32} color="white" />
        </View>
        <Text style={styles.referralTitle}>PASIEN DIRUJUK</Text>
        <Text style={styles.referralSubtitle}>
          Mohon tetap tenang, Bidan {bidanName} telah memproses rujukan.
        </Text>
      </View>

      {/* Body Informasi */}
      <View style={styles.referralBody}>
        {/* Tujuan RS (Statis) */}
        <View style={styles.referralSection}>
          <Text style={styles.referralLabel}>Faskes Tujuan:</Text>
          <TouchableOpacity
            style={styles.destinationBox}
            onPress={openMaps}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.destinationTitle}>{RS_INFO.nama}</Text>
              <Text style={styles.destinationAddress}>{RS_INFO.alamat}</Text>
            </View>
            <View style={styles.mapIconBtn}>
              <Feather name="map-pin" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Alasan Rujukan (Dinamis dari Status Ibu) */}
        <View style={styles.referralRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.referralLabel}>Indikasi Medis:</Text>
            <View style={styles.reasonBox}>
              <Ionicons
                name="medical"
                size={18}
                color="#D32F2F"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.referralValue}>{alasanRujukan}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// ==========================================
// 3. BREATHING & PANIC COMPONENTS
// ==========================================
const BreathingModal = ({ visible, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [textGuide, setTextGuide] = useState("Tarik Napas...");

  useEffect(() => {
    if (!visible) return;
    let isMounted = true;
    const breathe = () => {
      if (!isMounted) return;
      setTextGuide("Tarik Napas... 😤");
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration: 4000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }).start(() => {
        if (!isMounted) return;
        setTextGuide("Hembuskan Perlahan... 😮‍💨");
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }).start(() => breathe());
      });
    };
    breathe();
    return () => {
      isMounted = false;
      scaleAnim.setValue(1);
    };
  }, [visible, scaleAnim]);

  if (!visible) return null;
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.breathingOverlay}>
        <View style={styles.breathingContainerModal}>
          <Text style={styles.breathingTitle}>Sedang Kontraksi</Text>
          <View style={styles.circleWrapper}>
            <Animated.View
              style={[
                styles.breathingCircle,
                { transform: [{ scale: scaleAnim }] },
              ]}
            />
            <Text style={styles.breathingText}>{textGuide}</Text>
          </View>
          <Text style={styles.breathingSub}>
            Fokus pada lingkaran. Ikuti ritme napas untuk meredakan nyeri.
          </Text>
          <TouchableOpacity style={styles.closeBreathingBtn} onPress={onClose}>
            <Text style={styles.closeBreathingText}>
              Kontraksi Selesai / Tutup
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const PanicButton = ({ onPress, isLoading }) => {
  const [showConfirm, setShowConfirm] = React.useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.panicButton, isLoading && { opacity: 0.7 }]}
        onPress={isLoading ? null : () => setShowConfirm(true)}
        activeOpacity={0.85}
      >
        <View style={styles.panicInner}>
          <View style={styles.panicIconBg}>
            {isLoading ? (
              <ActivityIndicator color={COLORS.accentError} />
            ) : (
              <Ionicons
                name="alert-circle"
                size={32}
                color={COLORS.accentError}
              />
            )}
          </View>

          <View style={{ marginLeft: 15, flex: 1 }}>
            <Text style={styles.panicTitle}>
              {isLoading ? "MENGIRIM SINYAL..." : "PANGGIL BIDAN"}
            </Text>
            <Text style={styles.panicSub}>
              {isLoading
                ? "Mohon tunggu sebentar"
                : "Gunakan hanya saat darurat"}
            </Text>
          </View>

          {!isLoading && (
            <Ionicons name="chevron-forward" size={24} color="white" />
          )}
        </View>
      </TouchableOpacity>

      {/* Modal Konfirmasi */}
      <PanicConfirmModal
        visible={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          onPress();
        }}
      />
    </>
  );
};

// ==========================================
// 4. MAIN SCREEN
// ==========================================
export default function MainScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [panicLoading, setPanicLoading] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);

  // Data Pasien
  const [pasienName, setPasienName] = useState("");
  const [bidanName, setBidanName] = useState("Memuat Bidan...");

  // Status Logic
  const [isFinished, setIsFinished] = useState(false);
  const [isReferred, setIsReferred] = useState(false); // Status Rujukan
  const [babyData, setBabyData] = useState(null);
  const [referralReason, setReferralReason] = useState(""); // Alasan Rujukan

  // Partograf Data
  const [pembukaan, setPembukaan] = useState(0);
  const [djj, setDjj] = useState(0);
  const [sistolik, setSistolik] = useState("---");
  const [diastolik, setDiastolik] = useState("---");
  const [nadi, setNadi] = useState("---");
  const [suhu, setSuhu] = useState("---");
  const [waktuCatat, setWaktuCatat] = useState("");
  const [djjStatus, setDjjStatus] = useState({
    text: "Memuat",
    color: COLORS.textSecondary,
    message: "Memuat...",
  });

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    actions: [],
  });
  const isFocusMode = pembukaan >= 4 && pembukaan < 10;
  const activePhase = getDilatationPhase(pembukaan);
  const closeAlert = () => setAlertConfig({ ...alertConfig, visible: false });

  // === HELPER: GENERATE ALASAN RUJUKAN ===
  const generateReferralReason = (sis, dia, temp, hr) => {
    let reasons = [];

    // Parse angka (hilangkan string non-numeric)
    const s = parseFloat(sis);
    const d = parseFloat(dia);
    const t = parseFloat(temp);
    const h = parseFloat(hr);

    // Logika Medis Sederhana untuk Alasan Rujukan
    if (s >= 140 || d >= 90) reasons.push("Hipertensi (Tekanan Darah Tinggi)");
    if (s < 90 && s > 0) reasons.push("Hipotensi (Tekanan Darah Rendah)");
    if (t >= 38) reasons.push("Demam Tinggi (Febris)");
    if (h > 100) reasons.push("Takikardia (Nadi Cepat)");

    // Jika tidak ada yang abnormal tapi status rujukan, pakai alasan umum
    if (reasons.length === 0)
      return "Indikasi Medis / Perburukan Kondisi Ibu atau Janin";

    return reasons.join(", ");
  };

  // === FETCH STATUS PASIEN ===
  const fetchPatientStatus = async (noReg, token) => {
    try {
      const URL = `https://restful-api-bmc-production-v2.up.railway.app/api/pasien/${noReg}/getData`;
      const res = await fetch(URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (
        res.ok &&
        json.data &&
        json.data.persalinan &&
        json.data.persalinan.length > 0
      ) {
        const latestLabor = json.data.persalinan[0];

        if (latestLabor.status === "selesai") {
          // KONDISI 1: SELESAI
          setIsFinished(true);
          setIsReferred(false);
          setBabyData({
            jenis_kelamin: latestLabor.jenis_kelamin,
            berat_badan: latestLabor.berat_badan,
            panjang_badan: latestLabor.panjang_badan,
            tanggal_jam_waktu_bayi_lahir:
              latestLabor.tanggal_jam_waktu_bayi_lahir,
          });
        } else if (
          latestLabor.status === "rujukan" ||
          latestLabor.is_rujukan === 1
        ) {
          // KONDISI 2: RUJUKAN
          setIsReferred(true);
          setIsFinished(false);
        } else {
          // KONDISI 3: NORMAL
          setIsFinished(false);
          setIsReferred(false);
        }
      }
    } catch (err) {
      console.log("Error Fetch Status:", err);
    }
  };

  const fetchBidanData = async (pasienId, token) => {
    try {
      const res = await fetch(`${BASE_URL_PATIENT}/${pasienId}/bidanId`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.bidan_nama) setBidanName(json.bidan_nama.trim() || "Bidan");
      else setBidanName("Bidan Tidak Ditemukan");
    } catch (err) {
      setBidanName("Error Memuat Bidan");
    }
  };

  const fetchPartografData = async (pasienId, token) => {
    try {
      const res = await fetch(
        `${BASE_URL_PATIENT}/${pasienId}/progres-persalinan`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const reset = () => {
        setPembukaan(0);
        setDjj(0);
        setSistolik("---");
        setDiastolik("---");
        setNadi("---");
        setSuhu("---");
        setWaktuCatat("---");
        setDjjStatus(getDjjStatus(0));
      };

      if (!res.ok) {
        reset();
        return;
      }

      const json = await res.json();
      const latestData = getLatestFilledPartografData(json.data);
      if (!latestData) {
        reset();
        return;
      }

      // Set State Data Vital
      const s = cleanNumberString(latestData.sistolik);
      const d = cleanNumberString(latestData.diastolik);
      const n = cleanNumberString(latestData.nadi_ibu);
      const t = cleanNumberString(latestData.suhu_ibu, true);

      setPembukaan(parseFloat(latestData.pembukaan_servik) || 0);
      setDjj(parseFloat(latestData.djj) || 0);
      setSistolik(s);
      setDiastolik(d);
      setNadi(n);
      setSuhu(t);
      setWaktuCatat(latestData.waktu_catat || "---");
      setDjjStatus(getDjjStatus(parseFloat(latestData.djj) || 0));

      // Generate Alasan Rujukan (Jika status rujukan aktif)
      const reason = generateReferralReason(s, d, t, n);
      setReferralReason(reason);
    } catch (err) {
      console.log("ERROR PARTOGRAF:", err.message);
    }
  };

  const fetchData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        const token = await getTokenFromStorage();
        if (!token) {
          navigate("/login");
          return;
        }

        const { pasienId, pasienName, noReg } = decodeJwtPayload(token);
        setPasienName(pasienName);

        let regNumber = noReg;
        if (!regNumber) {
          const profileStr = await AsyncStorage.getItem("userProfile");
          if (profileStr) {
            const profile = JSON.parse(profileStr);
            regNumber = profile.no_reg;
          }
        }

        const promises = [
          fetchBidanData(pasienId, token),
          fetchPartografData(pasienId, token),
        ];
        if (regNumber) promises.push(fetchPatientStatus(regNumber, token));

        await Promise.all(promises);
      } catch (err) {
        console.log("GENERAL ERROR:", err.message);
      } finally {
        setLoading(false);
        if (isRefresh) setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);
  const onRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const handlePanic = async () => {
    closeAlert();
    Vibration.vibrate([0, 500, 200, 500]);
    setPanicLoading(true);
    try {
      const token = await getTokenFromStorage();
      if (!token) {
        setAlertConfig({
          visible: true,
          title: "Sesi Habis",
          message: "Login ulang.",
          type: "error",
          actions: [{ text: "Login", onPress: () => navigate("/login") }],
        });
        return;
      }
      const res = await fetch(
        "https://restful-api-bmc-production-v2.up.railway.app/api/darurat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tipe: "PANIC_BUTTON" }),
        }
      );
      if (!res.ok) throw new Error("Gagal kirim sinyal.");
      setAlertConfig({
        visible: true,
        title: "SINYAL TERKIRIM!",
        message: `Bidan ${bidanName} segera datang.`,
        type: "success",
        actions: [{ text: "SAYA MENGERTI", onPress: closeAlert }],
      });
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: "GAGAL",
        message: "Coba lagi.",
        type: "error",
        actions: [
          { text: "BATAL", style: "cancel", onPress: closeAlert },
          { text: "COBA LAGI", onPress: handlePanic },
        ],
      });
    } finally {
      setPanicLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.containerFixed}>
      <ModernAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        actions={alertConfig.actions}
      />
      <BreathingModal
        visible={showBreathing}
        onClose={() => setShowBreathing(false)}
      />

      <ScrollView
        style={styles.scrollViewContent}
        contentContainerStyle={{ paddingBottom: 150 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primaryBlue}
            colors={[COLORS.primaryBlue]}
          />
        }
      >
        <HeaderTop />

        {/* --- LOGIKA TAMPILAN UTAMA --- */}
        {isFinished ? (
          // === 1. TAMPILAN SELESAI (BAYI LAHIR) ===
          <View style={{ marginTop: 20 }}>
            <HeaderGradient pasienName={pasienName} />
            <BabyBornCard babyData={babyData} ibuName={pasienName} />
            <View style={{ marginHorizontal: 20, marginTop: 40 }}>
              <MidwifeCard
                bidanName={bidanName}
                activePhase="Selesai"
                waktuCatat={waktuCatat}
              />
            </View>
            <Text style={styles.focusFooterText}>
              "Terima kasih telah mempercayakan persalinan Bunda kepada kami."
            </Text>
          </View>
        ) : isReferred ? (
          // === 2. TAMPILAN RUJUKAN (STATIC HOSPITAL) ===
          <View style={{ marginTop: 20 }}>
            <HeaderGradient pasienName={pasienName} />

            {/* Kartu Rujukan dengan RS Statis & Alasan Dinamis */}
            <ReferralCard
              alasanRujukan={referralReason}
              bidanName={bidanName}
            />

            {/* Informasi Status Ibu (Penyebab Rujukan) */}
            <View style={{ marginTop: 10 }}>
              <IbuStatusCard
                sistolik={sistolik}
                diastolik={diastolik}
                nadi={nadi}
                suhu={suhu}
              />
            </View>
          </View>
        ) : isFocusMode ? (
          // === 3. TAMPILAN FOKUS (KONTRAKSI AKTIF) ===
          <View style={styles.focusModeContainer}>
            <HeaderGradient pasienName={pasienName} />
            <View style={{ marginBottom: 15, marginTop: 40 }}>
              <MidwifeCard
                bidanName={bidanName}
                activePhase={activePhase}
                waktuCatat={waktuCatat}
              />
            </View>
            <View style={{ marginTop: 10 }}>
              <IbuStatusCard
                sistolik={sistolik}
                diastolik={diastolik}
                nadi={nadi}
                suhu={suhu}
              />
            </View>
            <PanicButton onPress={handlePanic} isLoading={panicLoading} />
            <View style={{ marginTop: 5 }}>
              <DjjStatusCard djj={djj} djjStatus={djjStatus} />
            </View>
            <DilatationVisualizer pembukaan={pembukaan} />
            <TouchableOpacity
              style={styles.contractionBtn}
              onPress={() => setShowBreathing(true)}
              activeOpacity={0.7}
            >
              <View style={styles.contractionBtnIcon}>
                <Ionicons name="fitness" size={28} color={COLORS.primaryBlue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contractionBtnText}>
                  Mulai Panduan Napas
                </Text>
                <Text style={styles.contractionBtnSub}>
                  Tekan saat kontraksi
                </Text>
              </View>
              <Ionicons
                name="play-circle"
                size={32}
                color={COLORS.primaryBlue}
              />
            </TouchableOpacity>
            <Text style={styles.focusFooterText}>
              "Anda kuat, Bunda. Sebentar lagi bertemu si Kecil."
            </Text>
          </View>
        ) : (
          // === 4. TAMPILAN MONITORING NORMAL ===
          <>
            <HeaderGradient pasienName={pasienName} />
            {/* <TouchableOpacity
              style={[
                styles.contractionBtn,
                { marginTop: -20, marginBottom: 20 },
              ]}
              onPress={() => setShowBreathing(true)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.contractionBtnText}>
                  Latihan Pernapasan
                </Text>
                <Text style={styles.contractionBtnSub}>
                  Simulasi relaksasi napas
                </Text>
              </View>
              <Ionicons
                name="leaf-outline"
                size={24}
                color={COLORS.primaryBlue}
              />
            </TouchableOpacity> */}
            <MidwifeCard
              bidanName={bidanName}
              activePhase={activePhase}
              waktuCatat={waktuCatat}
            />
            <DilatationVisualizer pembukaan={pembukaan} />
            <DjjStatusCard djj={djj} djjStatus={djjStatus} />
            <IbuStatusCard
              sistolik={sistolik}
              diastolik={diastolik}
              nadi={nadi}
              suhu={suhu}
            />
          </>
        )}
      </ScrollView>
      <BottomTabBar navigate={navigate} />
    </View>
  );
}

// ==========================================
// STYLES (MAIN)
// ==========================================
const styles = StyleSheet.create({
  containerFixed: { flex: 1, backgroundColor: COLORS.offWhite },
  scrollViewContent: { flex: 1, backgroundColor: COLORS.offWhite },
  loadingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  loadingText: { marginTop: 10, color: COLORS.textSecondary, fontSize: 14 },

  // Modal & Alert Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    width: "100%",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
    textAlign: "center",
    color: COLORS.textPrimary,
  },
  modalMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancel: {
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#DDD",
  },
  modalBtnText: { fontWeight: "bold", fontSize: 14 },

  // Breathing Modal
  breathingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,10,30, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  breathingContainerModal: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 30,
    padding: 30,
    alignItems: "center",
    elevation: 10,
  },
  closeBreathingBtn: {
    marginTop: 30,
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 50,
    width: "100%",
    alignItems: "center",
  },
  closeBreathingText: { color: "white", fontSize: 16, fontWeight: "bold" },
  circleWrapper: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  breathingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightBlue,
    position: "absolute",
    opacity: 0.5,
  },
  breathingText: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primaryBlue,
    zIndex: 2,
    textAlign: "center",
  },
  breathingTitle: { fontSize: 20, fontWeight: "800", color: COLORS.darkBlue },
  breathingSub: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },

  // Contraction Btn
  contractionBtn: {
    marginHorizontal: 18,
    marginBottom: 15,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.primaryBlue,
    ...SHADOW_STYLE,
  },
  contractionBtnIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.lightBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  contractionBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primaryBlue,
    marginLeft: 15,
  },
  contractionBtnSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 15,
  },
  focusModeContainer: { marginTop: 10, paddingBottom: 20 },

  // Panic Button
  panicButton: {
    marginHorizontal: 18,
    marginBottom: 25,
    backgroundColor: COLORS.accentError,
    borderRadius: 20,
    padding: 15,
    ...SHADOW_STYLE,
    shadowColor: COLORS.accentError,
    shadowOpacity: 0.4,
    elevation: 8,
  },
  panicInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  panicIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  panicTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  panicSub: { color: COLORS.white, opacity: 0.9, fontSize: 13, marginTop: 2 },
  focusFooterText: {
    textAlign: "center",
    fontStyle: "italic",
    color: COLORS.textSecondary,
    marginTop: 10,
    fontSize: 14,
    marginBottom: 20,
  },

  // BABY BORN CARD
  bornContainer: {
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 24,
    overflow: "hidden",
    ...SHADOW_STYLE,
    marginBottom: 20,
  },
  bornHeader: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  bornTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  bornSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  bornBody: { padding: 20, alignItems: "center" },
  bornIconWrapper: { marginBottom: 15, position: "relative" },
  confettiIcon: { position: "absolute", top: -10, right: -15 },
  bornMessage: {
    textAlign: "center",
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  bornDivider: {
    height: 1,
    width: "100%",
    backgroundColor: "#EEE",
    marginVertical: 20,
  },
  bornGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  bornItem: {
    width: "48%",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
  },
  bornLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  bornValue: { fontSize: 16, fontWeight: "bold", color: "#333" },
  bornDate: {
    marginTop: 5,
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
  },

  // REFERRAL CARD STYLES
  referralContainer: {
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 24,
    overflow: "hidden",
    ...SHADOW_STYLE,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  referralHeader: {
    backgroundColor: "#FF9800",
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  referralIconPulse: {
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 50,
  },
  referralTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "white",
    letterSpacing: 1,
  },
  referralSubtitle: {
    textAlign: "center",
    color: "rgba(255,255,255,0.9)",
    marginTop: 5,
    fontSize: 14,
  },
  referralBody: { padding: 20 },
  referralSection: { marginBottom: 15 },
  referralLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 5 },
  destinationBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryBlue,
    elevation: 2,
  },
  destinationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.darkBlue,
    marginBottom: 4,
  },
  destinationAddress: { fontSize: 12, color: "#555", lineHeight: 16 },
  mapIconBtn: {
    backgroundColor: COLORS.primaryBlue,
    padding: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  referralValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#C62828",
    flex: 1,
    lineHeight: 20,
  },
  reasonBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
  },
  divider: { height: 1, backgroundColor: "#EEE", marginVertical: 15 },
  referralRow: { flexDirection: "row", alignItems: "center" },
  instructionBox: {
    marginTop: 20,
    backgroundColor: "#FFF8E1",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  instructionText: {
    marginLeft: 10,
    color: "#E65100",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
    fontWeight: "600",
  },
});

// ==========================================
// STYLES (MODAL)
// ==========================================
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    elevation: 6,
  },

  iconWrap: {
    alignSelf: "center",
    backgroundColor: "#FDECEA",
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#263238",
    marginBottom: 8,
  },

  desc: {
    fontSize: 14,
    color: "#546E7A",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },

  actions: {
    flexDirection: "row",
    gap: 12,
  },

  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#ECEFF1",
    alignItems: "center",
  },

  cancelText: {
    color: "#455A64",
    fontWeight: "600",
  },

  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#D32F2F",
    alignItems: "center",
  },

  confirmText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
