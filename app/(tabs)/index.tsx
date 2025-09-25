// LoginScreen
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
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { signIn } = useAuth();

  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    // Prevent empty fields
    if (!username.trim() || !password) {
      setErrorMessage("Please enter username and password.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      // Call sign-in function from context
      const result = await signIn(username.trim(), password);

      if (!result.success) {
        // Auth failed (wrong credentials or server returned error)
        setErrorMessage(result.message || "Invalid username or password.");
      } else {
        // Auth success
        Alert.alert("Success!", "You are now logged in.");
      }
    } catch (err) {
      // Network/server issue
      setErrorMessage("Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Logo */}
        <Image
          source={require("../../assets/images/astiro-logo.jpg")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Login</Text>

        {/* Username input */}
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="rgba(0,0,0,0.6)"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Password input */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="rgba(0,0,0,0.6)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          onSubmitEditing={handleLogin}
        />

        {/* Error message */}
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {/* Show spinner while logging in, else show login button */}
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

// Styles
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
    width: 250,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 24,
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
    backgroundColor: "rgba(24,115,255,1)",
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

