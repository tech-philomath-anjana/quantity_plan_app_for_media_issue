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

/**
 * - KeyboardAvoidingView keeps inputs visible when keyboard opens
 * - SafeAreaView ensures content doesn't overlap notches
 * - Inputs are responsive (width: "100%") so layout works across devices
 */
export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Called when the user taps the Login button (or submits password).
  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMessage("");

    const apiUrl = "http://13.126.182.69/api/login";
    const secretNote = {
      email: username, // Use username state for the email key
      password: password,
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(secretNote),
      });

      const reply = await response.json();

      if (response.ok && reply.success) {
        Alert.alert("Success!", "You are now logged in.");
        // TODO: Navigate to the next screen
      } else {
        setErrorMessage(reply.message || "Invalid username or password.");
      }
    } catch (error) {
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
        <Image
          source={require("/Users/anjana.mahasathian/Downloads/quantity_plan_app_for_media_issue-main/assets/images/astiro-logo.jpg")}
          style={styles.logo}
          resizeMode="contain"
          accessible
          accessibilityLabel="App Logo"
        />

        <Text style={styles.title}>Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="rgba(0,0,0,0.6)"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="rgba(0,0,0,0.6)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        {/* Show error message and spinner/button */}
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {isLoading ? (
          <ActivityIndicator size="large" color="#1873FF" style={{ marginTop: 8 }} />
        ) : (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Login"
          >
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        )}
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
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600'
  },
});