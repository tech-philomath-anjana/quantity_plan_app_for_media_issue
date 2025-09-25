// Agent Records Update Screen
// Supply / Update form for a single agent record

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
  Alert,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import UserProfile from "../components/UserProfile";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config";

export default function SupplyForm() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string | undefined;
  const { authFetch } = useAuth();

  // If the screen is opened without an id, send user back to list.
  useEffect(() => {
    if (!id) {
      router.replace("/agent_list");
    }
  }, [id, router]);

  // form fields (strings keep TextInput simple)
  const [baseSupply, setBaseSupply] = useState("");
  const [nightCorrections, setNightCorrections] = useState("");
  const [daysFigure, setDaysFigure] = useState("");
  const [extraQuantity, setExtraQuantity] = useState("");
  const [deliveryQuantity, setDeliveryQuantity] = useState("101");
  const [fixedQty, setFixedQty] = useState(true);

  // modal + animation state for "View More Details"
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Send update to backend. Using authFetch (from context) for auth headers.
  const handleUpdate = async () => {
    try {
      // basic client-side validation
      if (!id) {
        Alert.alert("Error", "Missing record id");
        return;
      }

      const payload = {
        id,
        baseSupply,
        nightCorrections,
        daysFigure,
        extraQuantity,
        deliveryQuantity,
        fixedQty,
      };

      const res = await authFetch(`${API_BASE}/update-agent-record`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();

      if (res.ok && json.success) {
        Alert.alert("Success", "Record updated successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", json.message || "Update failed");
      }
    } catch (err) {
      // keep the error message generic for users; log for debugging
      console.error("update error:", err);
      Alert.alert("Error", "Network or authentication error");
    }
  };

  // modal open/close with a short fade
  const openModal = () => {
    setModalVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.formWrapper}>
        {/* top-right user/profile component (handles its own layout) */}
        <UserProfile />

        {/* Read-only name field (replace static value with API data when available) */}
        <View style={[styles.inputContainer, styles.fullWidth]}>
          <Text style={styles.containerLabel}>Name</Text>
          <TextInput
            style={styles.containerInput}
            value="Ganesh" // TODO: load real name using id
            editable={false}
            selectTextOnFocus={false}
            accessibilityLabel="Agent name"
          />
        </View>

        {/* Status with subtle highlight */}
        <View style={[styles.statusBox, styles.fullWidth]}>
          <Text style={styles.statusText}>Status: Pre freeze print order</Text>
        </View>

        {/* Numeric input group */}
        <View style={[styles.inputRow, styles.fullWidth]}>
          <View style={styles.inputColumn}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Base Supply</Text>
              <TextInput
                style={styles.blueInput}
                keyboardType="numeric"
                value={baseSupply}
                onChangeText={setBaseSupply}
                placeholder="0"
                accessibilityLabel="Base supply"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Night Corrections</Text>
              <TextInput
                style={styles.blueInput}
                keyboardType="numeric"
                value={nightCorrections}
                onChangeText={setNightCorrections}
                placeholder="0"
                accessibilityLabel="Night corrections"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Days Figure</Text>
              <TextInput
                style={styles.blueInput}
                keyboardType="numeric"
                value={daysFigure}
                onChangeText={setDaysFigure}
                placeholder="0"
                accessibilityLabel="Days figure"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Extra Quantity</Text>
              <TextInput
                style={styles.blueInput}
                keyboardType="numeric"
                value={extraQuantity}
                onChangeText={setExtraQuantity}
                placeholder="0"
                accessibilityLabel="Extra quantity"
              />
            </View>
          </View>
        </View>

        {/* Delivery qty (editable) */}
        <View style={[styles.inputContainer, styles.fullWidth]}>
          <Text style={styles.containerLabel}>Delivery Quantity</Text>
          <TextInput
            style={styles.containerInput}
            keyboardType="numeric"
            value={deliveryQuantity}
            onChangeText={setDeliveryQuantity}
            accessibilityLabel="Delivery quantity"
          />
        </View>

        <TouchableOpacity
          style={[styles.updateButton, styles.fullWidth]}
          onPress={handleUpdate}
          accessibilityRole="button"
          accessibilityLabel="Update record"
        >
          <Text style={styles.updateText}>Update</Text>
        </TouchableOpacity>

        {/* fixed qty indicator + link to modal */}
        <View style={[styles.checkboxRow, styles.fullWidth]}>
          <View style={styles.checkboxLeft}>
            <View style={styles.checkbox}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text style={styles.checkboxLabel}>Fixed Qty</Text>
          </View>

          <TouchableOpacity style={styles.linkContainer} onPress={openModal}>
            <Text style={styles.link}>View More Details</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Details modal (animated fade) */}
      <Modal
        transparent
        visible={modalVisible}
        onRequestClose={closeModal}
        animationType="none"
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <View style={styles.blurBackground} />

          <View style={styles.modalContainer}>
            <View style={styles.detailsCard}>
              <Text style={styles.detailLabel}>Contract Details</Text>
              {/* TODO: populate with actual contract rows */}
            </View>

            <TouchableOpacity
              style={styles.separateCloseButton}
              onPress={closeModal}
              accessibilityRole="button"
              accessibilityLabel="Close details"
            >
              <Text style={styles.separateCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ScrollView container: centers on tall screens, scrolls on small ones
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? 24 : 20,
  },

  // keeps form readable on wide displays
  formWrapper: {
    width: "100%",
    maxWidth: 760,
    alignItems: "center",
  },

  // utility to expand elements to the wrapper width
  fullWidth: {
    width: "100%",
  },

  inputContainer: {
    borderWidth: 2.5,
    borderColor: "#333",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#fff",
    marginTop: 10,
    position: "relative",
  },
  containerLabel: {
    fontSize: 12,
    color: "#007bff",
    fontWeight: "500",
    backgroundColor: "#fff",
    paddingHorizontal: 6,
    position: "absolute",
    top: -8,
    left: 12,
    zIndex: 1,
  },
  containerInput: {
    padding: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  statusBox: {
    backgroundColor: "#ffe7d1",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e6a562",
    padding: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  statusText: { color: "#d9822b", fontWeight: "500" },

  inputRow: { marginBottom: 20 },
  inputColumn: { flex: 1 },

  fieldContainer: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  label: { fontWeight: "700", color: "#333", fontSize: 16, flex: 1, marginRight: 12 },

  // blue-styled numeric inputs
  blueInput: {
    borderWidth: 0,
    backgroundColor: "#CFE2FF",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
    flex: 2,
  },

  updateButton: {
    backgroundColor: "#007bff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  updateText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  checkboxLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#007bff",
    backgroundColor: "#007bff",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 3,
  },
  checkmark: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  checkboxLabel: { fontWeight: "600", marginLeft: 8, fontSize: 14, color: "#333" },

  linkContainer: { marginLeft: 12 },
  link: { color: "#007bff", fontSize: 14, fontWeight: "500" },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  blurBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "85%",
    maxHeight: "80%",
    overflow: "hidden",
    elevation: 5,
    alignItems: "center",
    paddingBottom: 16,
  },
  detailsCard: {
    backgroundColor: "#007bff",
    margin: 0,
    borderRadius: 0,
    padding: 24,
    width: "100%",
  },
  detailLabel: { color: "#fff", fontSize: 16, fontWeight: "400" },

  separateCloseButton: {
    backgroundColor: "#007bff",
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
    minWidth: 120,
  },
  separateCloseButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
