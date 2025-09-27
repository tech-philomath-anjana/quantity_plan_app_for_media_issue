// Quantity Planning screen
// - Small, focused form to pick Media Product, Publication Date and Phase
// - Uses a simple modal list picker for selections
// - Now fetches Media Products from API using AuthContext

import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TouchableHighlight,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import UserProfile from "../components/UserProfile";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { fetchMediaProducts } from "../services/apiService";

type ModalFor = null | "media" | "date" | "phase";

export default function QuantityPlanning() {
  const router = useRouter();
  const { authFetch } = useAuth(); // Get authFetch from context

  // form state
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [publicationDate, setPublicationDate] = useState<string | null>(null);
  const [phaseNo, setPhaseNo] = useState<string | null>(null);

  // modal state (what the modal is showing)
  const [modalVisible, setModalVisible] = useState(false);
  const [modalFor, setModalFor] = useState<ModalFor>(null);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // API data state
  const [mediaProducts, setMediaProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Static data for phases (you can make this dynamic too if needed)
  const phases = ["Phase 10"];

  // Fetch media products when component mounts
  useEffect(() => {
    loadMediaProducts();
  }, []);

  const loadMediaProducts = async () => {
    try {
      setLoading(true);
      const products = await fetchMediaProducts(authFetch); // Pass authFetch to the API function
      setMediaProducts(products);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to load media products. Please try again.',
        [
          { text: 'Retry', onPress: loadMediaProducts },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

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
    if (forWhat === "media" && loading) {
      Alert.alert('Loading', 'Please wait while media products are loading...');
      return;
    }
    
    if (forWhat === "date") {
      setShowDatePicker(true);
      return;
    }
    
    setModalFor(forWhat);
    setModalVisible(true);
  };

  // Handle date selection
  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
    setPublicationDate(currentDate.toLocaleDateString('en-CA')); // YYYY-MM-DD format
  };

  // render list items for the modal depending on modalFor
  const renderModalList = () => {
    if (modalFor === "media") {
      if (loading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1873FF" />
            <Text style={styles.loadingText}>Loading media products...</Text>
          </View>
        );
      }

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
                <Text style={styles.productCode}>{item.code}</Text>
                <Text style={styles.productDesc}>{item.desc}</Text>
              </View>
            </TouchableHighlight>
          )}
          showsVerticalScrollIndicator={true}
        />
      );
    }

    // phase only (date is handled by native date picker now)
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

          {/* Show loading indicator if media products are loading */}
          {loading && (
            <View style={styles.mainLoadingContainer}>
              <ActivityIndicator size="small" color="#1873FF" />
              <Text style={styles.mainLoadingText}>Loading options...</Text>
            </View>
          )}

          {/* Media product picker */}
          <TouchableOpacity
            style={[styles.selector, loading && styles.selectorDisabled]}
            onPress={() => openPicker("media")}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Select media product"
          >
            <Text style={[styles.selectorText, loading && styles.selectorTextDisabled]}>
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

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()} // Can't select past dates
          maximumDate={new Date(2030, 11, 31)} // Set reasonable max date
        />
      )}
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
  mainLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  mainLoadingText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
  },
  selector: {
    backgroundColor: "#eee",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectorDisabled: {
    backgroundColor: "#f5f5f5",
    opacity: 0.6,
  },
  selectorText: { color: "#333" },
  selectorTextDisabled: { color: "#999" },
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
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    color: "#666",
  },
  listItem: { 
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  productCode: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  productDesc: {
    fontSize: 14,
    color: "#666",
  },
  modalClose: { marginTop: 12 },
  modalCloseText: { color: "#007bff" },
});