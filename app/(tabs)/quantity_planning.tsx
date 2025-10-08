import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TouchableHighlight,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import * as SecureStore from "expo-secure-store";
import UserProfile from "../components/UserProfile";

/* ------------------------------------------------------------------
   API + token helpers
   - kept self-contained so this screen can log in / refresh automatically
   - token is stored in SecureStore with a small buffer before expiry
   ------------------------------------------------------------------ */

const BASE_URL = "http://13.126.182.69/api"; // API endpoint used by the app
const DEMO_EMAIL = "trainee@astiro-systems.com";
const DEMO_PASSWORD = "Astiro@2025";
const KEY_ACCESS_TOKEN = "access_token";
const KEY_TOKEN_EXP = "access_token_exp";

type ModalFor = null | "media" | "date" | "phase";
type MediaProduct = { product_code: string; product_desc: string; is_locked?: any };

/**
 * Save token + its expiry timestamp (seconds-since-epoch) in secure storage.
 */
async function setToken(token: string, expiresInSeconds: number) {
  const nowSec = Math.floor(Date.now() / 1000);
  const exp = nowSec + (expiresInSeconds || 3600);
  await SecureStore.setItemAsync(KEY_ACCESS_TOKEN, token);
  await SecureStore.setItemAsync(KEY_TOKEN_EXP, String(exp));
}

async function getStoredToken(): Promise<{ token: string | null; exp: number }> {
  const token = await SecureStore.getItemAsync(KEY_ACCESS_TOKEN);
  const expStr = await SecureStore.getItemAsync(KEY_TOKEN_EXP);
  const exp = expStr ? parseInt(expStr, 10) : 0;
  return { token, exp };
}

function isExpired(exp: number): boolean {
  // treat token as expired a bit before the exact moment to avoid races
  if (!exp) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= exp - 60; // 60s buffer
}

/** Log in using demo credentials and store token */
async function loginWithDemoCreds(): Promise<string> {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
  });
  const json = await res.json();
  if (!res.ok || json?.failed || !json?.data?.access_token) {
    throw new Error(json?.message || "Login failed");
  }
  const token = json.data.access_token;
  const expiresIn = json.data.expires_in ?? 3600;
  await setToken(token, expiresIn);
  return token;
}

/** Refresh token using current stored token */
async function refreshToken(): Promise<string> {
  const { token: current } = await getStoredToken();
  if (!current) throw new Error("No token to refresh");
  const res = await fetch(`${BASE_URL}/refresh`, {
    method: "GET",
    headers: { Authorization: `Bearer ${current}` },
  });
  const json = await res.json();
  if (!res.ok || json?.failed || !json?.data?.access_token) {
    throw new Error(json?.message || "Refresh failed");
  }
  const token = json.data.access_token;
  const expiresIn = json.data.expires_in ?? 3600;
  await setToken(token, expiresIn);
  return token;
}

/**
 * Return a valid access token. Attempts refresh first, otherwise logs in.
 * This keeps the component code simpler -- callers can assume a valid token.
 */
async function getAccessToken(): Promise<string> {
  const { token, exp } = await getStoredToken();
  if (token && !isExpired(exp)) return token;
  try {
    if (token) {
      return await refreshToken();
    } else {
      return await loginWithDemoCreds();
    }
  } catch {
    // If refresh fails for any reason, fall back to a fresh login
    return await loginWithDemoCreds();
  }
}

/** Fetch the master list of media products used in the dropdown */
async function fetchMediaProductsAPI(): Promise<MediaProduct[]> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}/fetch-master-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ masters: ["MediaProduct"] }),
  });
  const json = await res.json();
  if (!res.ok || json?.failed) {
    throw new Error(json?.message || "Failed to fetch Media Products");
  }
  return (json?.data?.MediaProduct ?? []) as MediaProduct[];
}

/* ------------------------------------------------------------------
   Main screen: QuantityPlanning
   - Friendly variable names + inline comments to explain intent
   - Small UI improvements kept from the original
   ------------------------------------------------------------------ */
export default function QuantityPlanning() {
  const router = useRouter();

  // form state
  const [selectedMediaLabel, setSelectedMediaLabel] = useState<string | null>(null); // human readable label
  const [selectedMediaCode, setSelectedMediaCode] = useState<string | null>(null); // code sent to API
  const [publicationDate, setPublicationDate] = useState<string | null>(null); // YYYY-MM-DD format
  const [phaseNo, setPhaseNo] = useState<string | null>("10");

  // temporary date state used by the date picker before the user hits Done
  const [tempDate, setTempDate] = useState<Date | null>(null);

  // modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalFor>(null);

  // media product list + UI states
  const [mediaProducts, setMediaProducts] = useState<MediaProduct[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // search text for the media product picker
  const [mediaSearch, setMediaSearch] = useState<string>("");

  const { width } = Dimensions.get("window");
  // simple scale to keep the calendar readable on small screens
  const calendarScale = Math.min(1, Math.max(0.85, Math.min(420 / width, 1)));

  useEffect(() => {
    // load media products once when the screen mounts
    setMediaLoading(true);
    (async () => {
      try {
        const list = await fetchMediaProductsAPI();
        setMediaProducts(list);
      } catch (e: any) {
        // show a small alert so users know why the dropdown might be empty
        setMediaError(e?.message ?? "Failed to load media products.");
        Alert.alert("Media Products", e?.message ?? "Failed to load media products.");
      } finally {
        setMediaLoading(false);
      }
    })();
  }, []);

  /** When GO is pressed, validate minimal fields and navigate */
  const handleGo = () => {
    if (!selectedMediaCode || !publicationDate) {
      alert("Please select Media Product and Publication Date");
      return;
    }

    router.push({
      pathname: "/(tabs)/agent_list",
      params: {
        product_code: String(selectedMediaCode).trim(),
        publication_date: String(publicationDate).trim(),
        phase_no: String(phaseNo ?? "10"),
      },
    });
  };

  /** Convenience: open one of the pickers and reset search when opening the media picker */
  const openPicker = (forWhat: ModalFor) => {
    setActiveModal(forWhat);
    if (forWhat === "media") setMediaSearch("");
    setModalVisible(true);
  };

  /** Render modal contents depending on which picker is active */
  const renderModalList = () => {
    if (activeModal === "media") {
      if (mediaLoading) {
        return (
          <View style={{ paddingVertical: 16, alignItems: "center" }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8 }}>Loading media products…</Text>
          </View>
        );
      }

      if (mediaError) {
        return (
          <View style={{ paddingVertical: 16 }}>
            <Text style={{ color: "red" }}>{mediaError}</Text>
          </View>
        );
      }

      // filter the list with a simple case-insensitive search
      const search = mediaSearch.trim().toLowerCase();
      const filtered = search
        ? mediaProducts.filter(
            (p) =>
              String(p.product_desc).toLowerCase().includes(search) ||
              String(p.product_code).toLowerCase().includes(search)
          )
        : mediaProducts;

      return (
        <View>
          {/* Search input at the top of the modal */}
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color="#666" style={{ marginRight: 8 }} />
            <TextInput
              value={mediaSearch}
              onChangeText={setMediaSearch}
              placeholder="Search media product or code"
              style={styles.searchInput}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {mediaSearch.length > 0 && (
              <TouchableOpacity onPress={() => setMediaSearch("")} style={{ padding: 6 }}>
                <Ionicons name="close-circle" size={18} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {filtered.length === 0 ? (
            <View style={{ padding: 16, alignItems: "center" }}>
              <Text style={{ color: "#666" }}>No results found</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.product_code}
              renderItem={({ item }) => (
                <TouchableHighlight
                  underlayColor="#f2f2f2"
                  onPress={() => {
                    // Set both the label and the code so the UI and navigation use the right values
                    setSelectedMediaLabel(`${item.product_desc} (${item.product_code})`);
                    setSelectedMediaCode(item.product_code);
                    setModalVisible(false);
                  }}
                  style={styles.listItem}
                >
                  <View>
                    <Text style={{ fontSize: 16 }}>{`${item.product_desc} (${item.product_code})`}</Text>
                  </View>
                </TouchableHighlight>
              )}
            />
          )}
        </View>
      );
    }

    if (activeModal === "date") {
      // date picker shows the temporary date; only commit when user presses Done
      const initial = tempDate ?? (publicationDate ? new Date(publicationDate) : new Date());
      return (
        <View>
          <View style={[styles.calendarContainer, { transform: [{ scale: calendarScale }] }]}>
            <DateTimePicker
              value={initial}
              mode="date"
              display={Platform.select({ ios: "inline", android: "calendar" })}
              onChange={(_: DateTimePickerEvent, date?: Date) => {
                if (date) setTempDate(date);
              }}
            />
          </View>

          <TouchableOpacity
            style={[styles.goButton, { marginTop: 12 }]}
            onPress={() => {
              const d = tempDate ?? new Date();
              setPublicationDate(dayjs(d).format("YYYY-MM-DD"));
              setModalVisible(false);
            }}
          >
            <Text style={styles.goButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeModal === "phase") {
      // currently only one phase exists in the app; kept flexible for future phases
      return (
        <FlatList
          data={["Phase 10"]
          }
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableHighlight
              underlayColor="#f2f2f2"
              onPress={() => {
                setPhaseNo("10");
                setModalVisible(false);
              }}
              style={styles.listItem}
            >
              <View>
                <Text style={{ fontSize: 16 }}>{item}</Text>
              </View>
            </TouchableHighlight>
          )}
        />
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header: back button, title, and user profile */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Back">
          <Ionicons name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"} size={24} color="#111" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Quantity Planning</Text>

        <UserProfile />
      </View>

      {/* Main form - centered card look */}
      <View style={styles.formBox}>
        <TouchableOpacity onPress={() => openPicker("media")} style={styles.inputCard}>
          <Text style={styles.fieldLabel}>
            Media Product <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldValue}>{selectedMediaLabel ?? "Select media product"}</Text>
            <Ionicons name="chevron-down" size={20} color="#111" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => openPicker("date")} style={styles.inputCard}>
          <Text style={styles.fieldLabel}>
            Publication Date <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldValue}>{publicationDate ?? "Select date"}</Text>
            <Ionicons name="calendar-outline" size={20} color="#111" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => openPicker("phase")} style={styles.inputCard}>
          <Text style={styles.fieldLabel}>Phase No</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldValue}>{`Phase ${phaseNo ?? "10"}`}</Text>
            <Ionicons name="chevron-down" size={20} color="#111" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGo} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>GO</Text>
        </TouchableOpacity>
      </View>

      {/* Generic centered modal used for all pickers */}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {activeModal === "media"
                ? "Select Media Product"
                : activeModal === "date"
                ? "Select Publication Date"
                : "Select Phase"}
            </Text>

            {renderModalList()}

            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* === Styles === */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  backButton: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111" },

  formBox: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  fieldLabel: { fontSize: 13, color: "#666", marginBottom: 6 },
  required: { color: "red" },
  inputCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#efefef",
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 14,
  },
  fieldRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fieldValue: { fontSize: 16, fontWeight: "600", color: "#111" },
  primaryButton: {
    marginTop: 8,
    width: 140,
    alignSelf: "center",
    backgroundColor: "#0b64ff",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#0b64ff",
    shadowOpacity: 0.24,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  // Centered modal with breathing space
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24, // breathing space
    paddingVertical: 40, // top/bottom spacing
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    maxWidth: 480,
    maxHeight: "85%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  modalTitle: { fontWeight: "700", marginBottom: 8, fontSize: 16, textAlign: "center" },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  modalClose: { marginTop: 12, alignItems: "center" },
  modalCloseText: { color: "#007bff" },
  calendarContainer: { alignSelf: "center", overflow: "hidden" },
  goButton: { backgroundColor: "#0b64ff", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  goButtonText: { color: "#fff", fontWeight: "700" },

  // Search bar
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: Platform.OS === "ios" ? 6 : 2 },
});
