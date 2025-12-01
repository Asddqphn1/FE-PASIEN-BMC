import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW_STYLE, cleanNumberString } from '../utils/global'; 
// Asumsi SHADOW_STYLE adalah shadow yang bagus untuk desain modern.

const DjjStatusCard = ({ djj, djjStatus }) => {
  // Destructuring untuk kemudahan akses dan kejelasan
  const { color: statusColor, text: statusText, message: statusMessage } = djjStatus;

  const isDanger = statusColor === COLORS.accentError;
  const isNormal = statusColor === COLORS.accentSuccess;
  const isNA = statusColor === COLORS.textSecondary;
  
  // Menggunakan warna background yang lebih kalem (sangat transparan)
  const backgroundColor = statusColor + '08'; // Sangat soft background, hampir putih/offWhite
  const cardBorderColor = statusColor;
  const iconColor = statusColor;
  
  // Menambahkan shadow hanya jika ada status yang jelas (danger/normal)
  const shadowStyle = isNA ? {} : styles.activeStatusShadow;

  return (
    <View style={styles.sectionWrapper}>
      <Text style={styles.sectionTitle}>
        <Ionicons name="heart-circle" size={18} color={COLORS.textPrimary} style={{ marginRight: 5 }} />
        Status Detak Jantung Janin
      </Text>
      
      {/* CARD UTAMA
        - Menggunakan border radius yang lebih besar (24) untuk kesan modern dan lembut.
        - Menghilangkan `SHADOW_STYLE` dari global, mengganti dengan shadow yang lebih spesifik
          atau hanya mengandalkan background/border untuk elevasi visual (jika perlu).
      */}
      <View style={[styles.statusCard, { backgroundColor, borderColor: cardBorderColor }, shadowStyle]}>

        {/* 1. NILAI DJJ (Paling Penting - Ditempatkan di Atas) */}
        <View style={styles.statusValueContainer}>
          <Text style={styles.statusValue}>
            {cleanNumberString(djj)}
          </Text>
          <Text style={styles.statusUnit}>bpm</Text>
        </View>

        {/* 2. HEADER STATUS (Gawat/Normal/NA) */}
        <View style={styles.statusHeader}>
          {/* Ikon dengan warna status */}
          <Ionicons name={isDanger ? "warning" : isNormal ? "checkmark-circle" : "alert-circle"} 
                    size={20} 
                    color={iconColor} />
          
          {/* Judul Status dengan Kapitalisasi yang Lebih Bersih */}
          <Text style={[styles.statusZoneTitle, { color: iconColor, marginLeft: 8 }]}>
            STATUS: {statusText.toUpperCase()} 
          </Text>
        </View>

        {/* 3. KETERANGAN/MESSAGE */}
        {/* Tambahkan garis pemisah tipis untuk kejelasan */}
        <View style={styles.separator} /> 
        
        <Text style={[styles.statusMessage, isNA && { fontStyle: 'italic', color: COLORS.textSecondary }]}>
          {statusMessage}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionWrapper: {
    paddingHorizontal: 18,
    marginBottom: 25,
  },
  // Mengubah posisi ikon ke title section agar lebih modern
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    // Tidak ada `🫀` lagi, diganti Ionicons di dalam Text
  },
  statusCard: {
    padding: 20, // Padding sedikit lebih besar
    borderRadius: 24, // Lebih membulat untuk kesan modern/nyaman
    borderWidth: 1.5, // Border sedikit lebih tipis
    // Shadow tidak dimasukkan di sini, tapi di `activeStatusShadow`
  },
  // Tambahkan shadow yang lebih halus dan berfokus pada warna status
  activeStatusShadow: {
    ...SHADOW_STYLE, // Menggunakan shadow global (asumsi sudah halus)
    shadowOpacity: 0.15, // Dibuat sedikit lebih transparan
    shadowRadius: 10,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // Jarak lebih lega
  },
  statusZoneTitle: {
    fontSize: 15,
    fontWeight: '700', // Tetap Bold
    letterSpacing: 0.3, // Letter spacing lebih kecil
  },
  statusValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10, // Memberi jarak ke status header
    alignSelf: 'flex-start', // Pastikan di kiri
  },
  statusValue: {
    fontSize: 48, // Lebih besar, jadi fokus utama
    fontWeight: '900',
    color: COLORS.textPrimary,
    lineHeight: 48, // Penting agar tidak memotong
  },
  statusUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 6, 
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border, // Asumsi COLORS.border adalah warna abu-abu muda
    opacity: 0.5,
    marginVertical: 10,
  },
  statusMessage: {
    fontSize: 14.5, // Ukuran sedikit dinaikkan
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
});

export default DjjStatusCard;