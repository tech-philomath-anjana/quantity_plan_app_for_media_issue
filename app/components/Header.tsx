//Header.tsx

import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import UserProfile from "./UserProfile";

/**
 * Simple app header with:
 * - A back button (on the left)
 * - A user profile icon/menu (on the right)
 *
 * Use this header on screens where users can navigate back or access their profile.
 * Avoid using it on login, onboarding, or home menu screens.
 */

export default function Header() {
  const router = useRouter();

  // Go back to the previous screen if possible, otherwise go home.
  const handleBackPress = () => {
    try {
      router.back();
    } catch {
      router.replace("/");
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.header}>
        {/* Back button */}
        <TouchableOpacity
          onPress={handleBackPress}
          accessibilityLabel="Go back"
          style={styles.sideButton}
        >
          <Ionicons
            name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
            size={24}
            color="#000"
          />
        </TouchableOpacity>

        {/* Middle space — screens can insert a title if they want */}
        <View style={styles.centerContent} />

        {/* User profile button/menu */}
        <View style={styles.sideButton}>
          <UserProfile />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#fff",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e6e6e6",
    backgroundColor: "#fff",
  },
  sideButton: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
