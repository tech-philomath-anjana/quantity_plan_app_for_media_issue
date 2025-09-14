// Main Menu Screen
import { useRouter } from "expo-router";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";

export default function MainMenuScreen() {
  const router = useRouter(); 
  const handlePress = () => {
    router.push("/agent_records_update"); 
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Text style={styles.title}>Main Menu</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handlePress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Quantity Planning"
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
    maxWidth: 420,
    height: 50,
    backgroundColor: "rgba(24,115,255,1)", 
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
