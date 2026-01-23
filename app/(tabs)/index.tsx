// LoginScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";

export default function LoginScreen() {
  const { signIn } = useAuth();

  // Form input state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // UI and feedback state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Handle the login button press
   * - Validates input
   * - Calls the signIn method from AuthContext
   * - Manages loading and error feedback
   */
  const handleLogin = async () => {
    // Basic input validation
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Please enter your username and password.");
      return;
    }

    // Reset error message and show loading spinner
    setErrorMessage("");
    setIsLoading(true);

    try {
      // Attempt to sign in via AuthContext
      const result = await signIn(username.trim(), password);

      if (!result.success) {
        // Sign-in failed (invalid credentials or server error)
        setErrorMessage(result.message || "Invalid username or password.");
      }
    } catch (error) {
      // Catch network or unexpected issues
      console.error("Login error:", error);
      setErrorMessage("Unable to connect to the server. Please try again later.");
    } finally {
      // Always stop the loading spinner
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* App logo */}
        <Image
          source={require("../../assets/images/astiro-logo.jpg")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Login</Text>

        {/* Username Field */}
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="rgba(0,0,0,0.6)"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
        />

        {/* Password Field */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="rgba(0,0,0,0.6)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          onSubmitEditing={handleLogin}
          returnKeyType="done"
        />

        {/* Display an error message, if any */}
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {/* Show loading spinner or login button */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#1873FF" style={{ marginTop: 8 }} />
        ) : (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles ---
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
  logo: {
    width: 240,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 24,
    color: "#000",
  },
  input: {
    width: "100%",
    maxWidth: 420,
    height: 52,
    backgroundColor: "rgba(217,217,217,1)",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  loginButton: {
    width: "100%",
    maxWidth: 420,
    height: 50,
    backgroundColor: "#1873FF",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "600",
  },
});
