import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const HeaderGradient = ({ pasienName }) => {
  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={["#E3F2FD", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.container}
      >
        <View style={styles.row}>
          {/* Icon Ibu */}
          <View style={styles.iconWrapper}>
            <Ionicons name="woman-outline" size={28} color="#1E88E5" />
          </View>

          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={styles.greeting}>Halo, Bunda {pasienName}</Text>
            <Text style={styles.subtitle}>
              Pantau kesehatan ibu & janin dengan nyaman
            </Text>
          </View>
        </View>

        {/* Info Tambahan */}
        <View style={styles.infoBox}>
          <Ionicons name="heart-outline" size={16} color="#1E88E5" />
          <Text style={styles.infoText}>
            Semoga persalinan berjalan lancar dan sehat
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

export default HeaderGradient;
const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
    elevation: 4,
  },

  container: {
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  textContainer: {
    flex: 1,
  },

  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#263238",
  },

  subtitle: {
    fontSize: 14,
    color: "#607D8B",
    marginTop: 4,
  },

  infoBox: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F8FF",
    padding: 12,
    borderRadius: 12,
  },

  infoText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#455A64",
  },
});
