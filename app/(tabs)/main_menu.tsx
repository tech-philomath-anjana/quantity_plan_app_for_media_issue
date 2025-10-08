/**
 * Main Menu Screen
 * 
 * Displays:
 * - User profile avatar in the top-right corner
 * - A single button for "Quantity Planning"
 * 
 * This serves as the entry point for navigation within the app.
 */

import React from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  View,
} from "react-native";
import { useRouter } from "expo-router";

// Local component (lives under /app/components)
import UserProfile from "../components/UserProfile";

export default function MainMenuScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* --- Header Section --- */}
      <View style={styles.header}>
        {/* Placeholder on the left keeps layout balanced */}
        <View style={styles.headerSpacer} />

        {/* Profile avatar sits on the right */}
        <View style={styles.profileContainer}>
          <UserProfile />
        </View>
      </View>

      {/* --- Main Content --- */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Text style={styles.title}>Main Menu</Text>

        {/* Currently only one available action */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/quantity_planning")}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Go to Quantity Planning"
        >
          <Text style={styles.buttonText}>Quantity Planning</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // --- Header / Top Bar ---
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee", // subtle divider
  },
  headerSpacer: {
    width: 44, // keeps symmetry with profile container
  },
  profileContainer: {
    width: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  // --- Main Content ---
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 24,
    color: "#000",
  },

  // --- Button ---
  button: {
    width: "100%",
    maxWidth: 420, // prevents full-width stretch on tablets
    height: 50,
    backgroundColor: "#1873FF", // app primary blue
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3, // subtle Android shadow
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
