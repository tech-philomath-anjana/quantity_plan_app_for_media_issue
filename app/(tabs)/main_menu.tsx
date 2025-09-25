/**
 * Main Menu Screen
 * - Shows the user profile in the top-right
 * - Displays one action button: "Quantity Planning"
 */

import React from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";

// Components are colocated under /app/components
import UserProfile from "../components/UserProfile";

export default function MainMenuScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      {/* User profile shortcut (top-right corner UI handled in UserProfile itself) */}
      <UserProfile />

      {/* Main content is centered; shifts up when keyboard is open */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Text style={styles.title}>Main Menu</Text>

        {/* Only available menu option for now */}
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
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 24,
  },
  button: {
    width: "100%",
    maxWidth: 420, // keeps button from stretching too wide on tablets
    height: 50,
    backgroundColor: "rgba(24,115,255,1)", // app primary blue
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
