// Quantity Planning screen
// - Small, focused form to pick Media Product, Publication Date and Phase
// - Uses a simple modal list picker for selections

import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TouchableHighlight,
} from "react-native";
import UserProfile from "../components/UserProfile";
import { useRouter } from "expo-router";

type ModalFor = null | "media" | "date" | "phase";

export default function QuantityPlanning() {
  const router = useRouter();

  // form state
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [publicationDate, setPublicationDate] = useState<string | null>(null);
  const [phaseNo, setPhaseNo] = useState<string | null>(null);

  // modal state (what the modal is showing)
  const [modalVisible, setModalVisible] = useState(false);
  const [modalFor, setModalFor] = useState<ModalFor>(null);

  // --- Sample / placeholder data (replace with API data later) ---
  const mediaProducts = [
    { code: "BLDS", desc: "BusinessLine Daily Supplement" },
    { code: "BLMB", desc: "BusinessLine Mumbai Edition" },
    { code: "CFBM", desc: "TH English Daily Classifieds Mumbai" },
  ];
  const dates = ["2025-09-24", "2025-09-25", "2025-09-26"];
  const phases = ["Phase 1", "Phase 2", "Phase 3"];

  // Navigate to next screen once required fields are chosen
  const handleGo = () => {
    if (!selectedMedia || !publicationDate) {
      alert("Please select Media Product and Publication Date");
      return;
    }
    // TODO: pass params if needed; for now just navigate
    router.push("/(tabs)/agent_list");
  };

  // open picker modal for a specific field
  const openPicker = (forWhat: ModalFor) => {
    setModalFor(forWhat);
    setModalVisible(true);
  };

  // render list items for the modal depending on modalFor
  const renderModalList = () => {
    if (modalFor === "media") {
      return (
        <FlatList
          data={mediaProducts}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <TouchableHighlight
              underlayColor="#f2f2f2"
              onPress={() => {
                setSelectedMedia(item.desc);
                setModalVisible(false);
              }}
            >
              <View style={styles.listItem}>
                <Text>{item.desc}</Text>
              </View>
            </TouchableHighlight>
          )}
        />
      );
    }

    if (modalFor === "date") {
      return (
        <FlatList
          data={dates}
          keyExtractor={(d) => d}
          renderItem={({ item }) => (
            <TouchableHighlight
              underlayColor="#f2f2f2"
              onPress={() => {
                setPublicationDate(item);
                setModalVisible(false);
              }}
            >
              <View style={styles.listItem}>
                <Text>{item}</Text>
              </View>
            </TouchableHighlight>
          )}
        />
      );
    }

    // phase
    return (
      <FlatList
        data={phases}
        keyExtractor={(p) => p}
        renderItem={({ item }) => (
          <TouchableHighlight
            underlayColor="#f2f2f2"
            onPress={() => {
              setPhaseNo(item);
              setModalVisible(false);
            }}
          >
            <View style={styles.listItem}>
              <Text>{item}</Text>
            </View>
          </TouchableHighlight>
        )}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* top-right profile */}
      <UserProfile />

      <View style={styles.container}>
        <View style={styles.formBox}>
          <Text style={styles.title}>Quantity Planning</Text>

          {/* Media product picker */}
          <TouchableOpacity
            style={styles.selector}
            onPress={() => openPicker("media")}
            accessibilityRole="button"
            accessibilityLabel="Select media product"
          >
            <Text style={styles.selectorText}>
              {selectedMedia ?? "Media Product *"}
            </Text>
          </TouchableOpacity>

          {/* Publication date picker */}
          <TouchableOpacity
            style={styles.selector}
            onPress={() => openPicker("date")}
            accessibilityRole="button"
            accessibilityLabel="Select publication date"
          >
            <Text style={styles.selectorText}>
              {publicationDate ?? "Publication Date *"}
            </Text>
          </TouchableOpacity>

          {/* Phase picker (optional) */}
          <TouchableOpacity
            style={styles.selector}
            onPress={() => openPicker("phase")}
            accessibilityRole="button"
            accessibilityLabel="Select phase number"
          >
            <Text style={styles.selectorText}>{phaseNo ?? "Phase No"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.goButton}
            onPress={handleGo}
            accessibilityRole="button"
            accessibilityLabel="Go to agent list"
          >
            <Text style={styles.goText}>GO</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Simple modal list picker */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {modalFor === "media"
                ? "Select Media Product"
                : modalFor === "date"
                ? "Select Publication Date"
                : "Select Phase"}
            </Text>

            {renderModalList()}

            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  formBox: {
    width: "100%",
    maxWidth: 400,
    alignItems: "stretch",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  selector: {
    backgroundColor: "#eee",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectorText: { color: "#333" },
  goButton: {
    backgroundColor: "#1873FF",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
    alignSelf: "center",
    minWidth: 120,
  },
  goText: { color: "#fff", fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    maxHeight: "70%",
  },
  modalTitle: { fontWeight: "700", marginBottom: 8 },
  listItem: { paddingVertical: 10 },
  modalClose: { marginTop: 12 },
  modalCloseText: { color: "#007bff" },
});
