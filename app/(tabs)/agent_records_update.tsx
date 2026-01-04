import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config";
import UserProfile from "../components/UserProfile";

/**
 * AgentRecordsUpdate
 * ------------------
 * A full-screen form that prefetches a detail row for an agent and
 * lets a user update quantity fields (base supply, night corrections, days figure etc.)
 * and save back to the backend API.
 */

export default function AgentRecordsUpdate() {
  const router = useRouter();
  // search params passed to this screen (contract_no, item_no, product_code, publication_date etc.)
  const params = useLocalSearchParams() as Record<string, string | undefined>;
  const { authFetch, user } = useAuth();

  // core identifiers passed into the screen. Default to empty string so we avoid undefined checks.
  const contract_no = params.contract_no ?? "";
  const item_no = params.item_no ?? "";
  const product_code = params.product_code ?? "";
  const publication_date = params.publication_date ?? "";
  const media_issue = params.media_issue ?? "";

  // UI state for editable fields
  const [name, setName] = useState<string>(""); // agent display name
  const [statusLabel, setStatusLabel] = useState<string>(""); // media issue status text

  // numeric fields are stored as strings to preserve the exact typed value while editing
  const [baseSupply, setBaseSupply] = useState<string>("");
  const [nightCorrections, setNightCorrections] = useState<string>("");
  const [daysFigure, setDaysFigure] = useState<string>("");
  const [extraQuantity, setExtraQuantity] = useState<string>("");
  const [deliveryQuantity, setDeliveryQuantity] = useState<string>("");

  // boolean toggle for fixed quantity
  const [fixedQty, setFixedQty] = useState<boolean>(false);

  // identifying / optional fields that may appear in the detail row
  const [phaseNo, setPhaseNo] = useState<number | null>(null);
  const [shipToParty, setShipToParty] = useState<string | null>(null);
  const [salesContractItemCat, setSalesContractItemCat] = useState<string | null>(null);

  // loading flags
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // keep the full detail row object returned by the server — useful for the modal and for fallbacks
  const [fullDetail, setFullDetail] = useState<any | null>(null);

  // ---------------------------------------------------------------------------
  // Prefetch detail row when screen mounts or when identifying params change.
  // This mirrors original behaviour: call mobapp_get_detail_view with product_code + publication_date
  // and pick the matching contract_no+item_no row (or fall back to the first returned row).
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // if a delivery_qty param is present initially (coming from list screen), set it
    if (params.delivery_qty) setDeliveryQuantity(String(params.delivery_qty));

    // guard: we need at minimum the product code and publication date to query details
    if (!product_code || !publication_date) return;

    (async () => {
      try {
        setLoading(true);
        const payload = { product_code, publication_date };

        const res = await authFetch(`${API_BASE}/mobapp_get_detail_view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (json && json.data && Array.isArray(json.data) && json.data.length > 0) {
          // prefer exact match on contract_no + item_no, otherwise take the first row returned
          const match =
            json.data.find(
              (r: any) => String(r.contract_no) === String(contract_no) && String(r.item_no) === String(item_no)
            ) ?? json.data[0];

          if (match) {
            // save the entire object so the modal and save flow can rely on it
            setFullDetail(match);

            // populate form fields using the returned values; use sensible fallbacks
            setName(String(match.business_partner_fullname ?? ""));
            setStatusLabel(String(match.media_issue_status ?? ""));
            setBaseSupply(String(match.base_supply ?? match.quantity1 ?? "0"));
            setNightCorrections(String(match.night_correction ?? match.quantity2 ?? "0"));
            setDaysFigure(String(match.days_figure ?? match.quantity3 ?? "0"));
            setExtraQuantity(String(match.extra_qty ?? match.quantity4 ?? "0"));
            setDeliveryQuantity(String(match.delivery_qty ?? match.quantity ?? "0"));
            setFixedQty(Boolean(Number(match.fixed_indicator ?? 0)));

            // optional identifying fields
            if (match.phase_no !== undefined && match.phase_no !== null) {
              setPhaseNo(Number(match.phase_no));
            }
            if (match.ship_to_party !== undefined && match.ship_to_party !== null) {
              setShipToParty(String(match.ship_to_party));
            }
            if (match.sales_contract_item_cat !== undefined && match.sales_contract_item_cat !== null) {
              setSalesContractItemCat(String(match.sales_contract_item_cat));
            }
          }
        }
      } catch (err) {
        // keep a console warning to assist debugging in development
        // eslint-disable-next-line no-console
        console.warn("prefetch detail failed", err);
      } finally {
        setLoading(false);
      }
    })();
    // NOTE: we intentionally exclude authFetch and API_BASE from deps to mimic previous behaviour
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product_code, publication_date, contract_no, item_no, params.delivery_qty]);

  const isPreFreeze = statusLabel.toLowerCase().includes("pre freeze");

  // ---------------------------------------------------------------------------
  // Simple validator for numeric text inputs. Accepts an empty string (so the user can clear),
  // or an integer (optionally negative). We keep the same behaviour as original code.
  // ---------------------------------------------------------------------------
  const validateNumberInput = (v: string) => {
    if (v === "") return true;
    return /^-?\d*$/.test(v);
  };

  // ---------------------------------------------------------------------------
  // Save handler: validates required data, builds the detail row payload and calls
  // save_quantity_plan_media_issue endpoint. Mirrors original logic closely.
  // ---------------------------------------------------------------------------
  const onSave = async () => {
    // basic required identifiers check — the backend needs these
    if (!contract_no || !product_code || !publication_date || !item_no) {
      Alert.alert(
        "Missing identifiers",
        "Contract, product, publication date and item number are required to save."
      );
      return;
    }

    // delivery quantity is a required field in the UI (user must explicitly set it — can be 0)
    if (deliveryQuantity === "") {
      Alert.alert("Validation", "Please provide Delivery Quantity (can be 0).");
      return;
    }

    // helper to parse the (possibly empty) numeric strings into numbers
    const parsed = (s: string) => (s === "" ? 0 : Number(s));

    // build the detail row exactly as the backend expects
    const detailRow: any = {
      version: "000",
      product_code,
      media_issue,
      contract_no,
      publication_date,
      sales_org: "10IN",
      dis_channel: "D2",
      division: "N2",
      plant: "10IN",
      contract_type: "CQ",
      // prefer explicit value from state, otherwise fall back to fullDetail or a safe default
      ship_to_party: shipToParty ?? (fullDetail?.ship_to_party ?? "0"),
      sales_office: fullDetail?.sales_office ?? "10SO",
      sales_group: fullDetail?.sales_group ?? "MSG",
      sales_district: fullDetail?.sales_district ?? "IN0003",
      sales_unit: fullDetail?.sales_unit ?? "EA",
      item_no: Number(item_no || 0),
      sales_contract_item_cat: salesContractItemCat ?? fullDetail?.sales_contract_item_cat ?? "KMN",

      // quantities — main one is `quantity` which we send as deliveryQuantity
      quantity: parsed(deliveryQuantity),
      quantity1: parsed(baseSupply),
      quantity2: parsed(nightCorrections),
      quantity3: parsed(daysFigure),
      quantity4: parsed(extraQuantity),

      // ensure quantity5..quantity9 are always present (database expects NOT NULL)
      quantity5: fullDetail?.quantity5 ?? fullDetail?.extra_qty ?? 0,
      quantity6: fullDetail?.quantity6 ?? 0,
      quantity7: fullDetail?.quantity7 ?? 0,
      quantity8: fullDetail?.quantity8 ?? 0,
      quantity9: fullDetail?.quantity9 ?? 0,

      fixed_indicator: fixedQty ? 1 : 0,
      is_deleted: 0,
      status: "20",
      business_partner_fullname: name,
      media_issue_status: statusLabel,
      base_unit: fullDetail?.base_unit ?? "EA",
      item_cat_desc: fullDetail?.item_cat_desc ?? "Paid",
      includeQuantity1: false,

      // who updated this row — try to be flexible with user object shape
      updated_by: (user && (user.id ?? (user.userId ?? (user.user_id ?? 0)))) ?? 0,
    };

    // include phase_no only if present in either user input or fullDetail
    if (phaseNo !== null || fullDetail?.phase_no) {
      detailRow.phase_no = phaseNo ?? fullDetail?.phase_no;
    }

    const payload = {
      publication_date,
      detail_rows: [detailRow],
    };

    try {
      setLoading(true);
      const res = await authFetch(`${API_BASE}/save_quantity_plan_media_issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json && json.status_code === 200) {
        // success — navigate back after user acknowledges the alert
        Alert.alert("Success", "Quantity Plan updated.", [{ text: "OK", onPress: () => router.back() }]);
      } else {
        // try to show a meaningful error message returned by the server
        const msg = (json && (json.message || json.error)) || "Failed to save. Check identifiers.";
        Alert.alert("Save failed", String(msg));
      }
    } catch (err) {
      // network / unexpected error
      // eslint-disable-next-line no-console
      console.error("Save error", err);
      Alert.alert("Network error", "Couldn't save. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // View More Details -> shows modal. If we don't already have fullDetail, fetch it.
  // This keeps the same UX as before: prefer cached fullDetail, otherwise fetch and then open modal.
  // ---------------------------------------------------------------------------
  const handleViewMore = async () => {
    if (fullDetail) {
      setModalVisible(true);
      return;
    }

    if (!product_code || !publication_date) {
      Alert.alert("Missing data", "Cannot fetch details for this agent.");
      return;
    }

    try {
      setModalLoading(true);
      const payload = { product_code, publication_date };
      const res = await authFetch(`${API_BASE}/mobapp_get_detail_view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json && json.data && Array.isArray(json.data)) {
        const match =
          json.data.find(
            (r: any) => String(r.contract_no) === String(contract_no) && String(r.item_no) === String(item_no)
          ) ?? json.data[0];

        if (match) {
          setFullDetail(match);
          setModalVisible(true);
        } else {
          Alert.alert("Not found", "No detail row found for this agent.");
        }
      } else {
        Alert.alert("No data", "Detail API returned no data.");
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("modal fetch failed", err);
      Alert.alert("Error", "Failed to fetch details.");
    } finally {
      setModalLoading(false);
    }
  };

  // A small presentational helper for the details modal rows. Kept inside the component so styles can be shared.
  const DetailRow = ({ label, value }: { label: string; value: any }) => (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value}>{value ?? "—"}</Text>
    </View>
  );

  // -------------------------------------
  // Render
  // -------------------------------------
  return (
    <SafeAreaView style={styles.safe}>
      {/* Top header: back button, title, user profile */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topBack} accessibilityLabel="Back">
          <Ionicons name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"} size={20} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>Update Agent</Text>

        <View style={styles.topProfile}>
          <UserProfile />
        </View>
      </View>

      {/* Form content (Keyboard-aware + scrollable) */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.formWrapper}>
            {/* Name (non-editable) */}
            <View style={styles.headerRow}>
              <View style={styles.nameWrap}>
                <Text style={styles.smallLabel}>Name</Text>
                <TextInput
                  style={styles.nameInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Agent name"
                  editable={false}
                  selectTextOnFocus={false}
                />
              </View>
            </View>

            {/* Status badge */}
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>Status: {statusLabel || "—"}</Text>
            </View>

            {/* Numeric fields (each uses the validator to avoid non-integer input) */}
            <View style={styles.compactGroup}>
              <Text style={styles.fieldLabel}>Base Supply</Text>
              <TextInput
              keyboardType="numeric"
              value={baseSupply}
              editable={!isPreFreeze}
              style={[
                styles.compactInput,
                isPreFreeze && { backgroundColor: "#e5e7eb" }
              ]}
              onChangeText={(v) => validateNumberInput(v) && setBaseSupply(v)}
              placeholder="0"
            />
            </View>

            <View style={styles.compactGroup}>
              <Text style={styles.fieldLabel}>Night Corrections</Text>
              <TextInput
                keyboardType="numeric"
                value={nightCorrections}
                onChangeText={(v) => validateNumberInput(v) && setNightCorrections(v)}
                style={styles.compactInput}
                placeholder="0"
                placeholderTextColor="#7a7a7a"
              />
            </View>

            <View style={styles.compactGroup}>
              <Text style={styles.fieldLabel}>Days Figure</Text>
              <TextInput
              keyboardType="numeric"
              value={daysFigure}
              editable={!isPreFreeze}
              style={[
                styles.compactInput,
                isPreFreeze && { backgroundColor: "#e5e7eb" }
              ]}
              onChangeText={(v) => validateNumberInput(v) && setDaysFigure(v)}
              placeholder="0"
            />
            </View>

            <View style={styles.compactGroup}>
              <Text style={styles.fieldLabel}>Extra Quantity</Text>
              <TextInput
              keyboardType="numeric"
              value={extraQuantity}
              editable={!isPreFreeze}
              style={[
                styles.compactInput,
                isPreFreeze && { backgroundColor: "#e5e7eb" }
              ]}
              onChangeText={(v) => validateNumberInput(v) && setExtraQuantity(v)}
              placeholder="0"
            />
            </View>

            <View style={[styles.compactGroup, { marginTop: 8 }]}> 
              <Text style={styles.fieldLabel}>Delivery Quantity</Text>
              <TextInput
              keyboardType="numeric"
              value={deliveryQuantity}
              editable={!isPreFreeze}
              style={[
                styles.compactInput,
                styles.deliveryInput,
                isPreFreeze && { backgroundColor: "#e5e7eb" }
              ]}
              onChangeText={(v) => validateNumberInput(v) && setDeliveryQuantity(v)}
              placeholder="0"
            />

            </View>

            {/* Primary action button: Update */}
            <TouchableOpacity
              style={[styles.updateButton, loading ? styles.updateButtonDisabled : null]}
              onPress={onSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateText}>Update</Text>}
            </TouchableOpacity>

            {/* bottom row: fixed qty switch and view more link */}
            <View style={styles.bottomRow}>
              <View style={styles.fixedWrap}>
                <Switch value={fixedQty} onValueChange={setFixedQty} />
                <Text style={styles.fixedText}>Fixed Qty</Text>
              </View>

              <TouchableOpacity onPress={handleViewMore}>
                <Text style={styles.viewMore}>View More Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal: shows the fullDetail object in a compact card */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={detailStyles.modalOverlay}>
          <View style={detailStyles.modalCard}>
            {modalLoading ? (
              <ActivityIndicator size="large" />
            ) : (
              <>
                <Text style={detailStyles.cardTitle}>
                  {fullDetail?.business_partner_fullname ?? name} - Details
                </Text>

                <ScrollView style={{ width: "100%" }}>
                  {/* Important identifying fields. We prefer values from fullDetail, with fallbacks. */}
                  <DetailRow label="Ship to Party:" value={fullDetail?.ship_to_party ?? shipToParty} />
                  <DetailRow label="Contract No:" value={fullDetail?.contract_no ?? contract_no} />
                  <DetailRow label="Item Number:" value={fullDetail?.item_no ?? item_no} />
                  <DetailRow
                    label="Sales Unit:"
                    value={fullDetail?.sales_unit ?? fullDetail?.base_unit ?? "EA"}
                  />
                  <DetailRow label="Sales Orgs:" value={fullDetail?.sales_org} />
                  <DetailRow label="Dis Channels:" value={fullDetail?.dis_channel} />
                  <DetailRow label="Division:" value={fullDetail?.division} />
                  <DetailRow
                    label="Item Category:"
                    value={fullDetail?.sales_contract_item_cat ?? salesContractItemCat}
                  />

                  {/* address may exist under several keys; show whichever is present */}
                  {fullDetail?.address || fullDetail?.business_partner_address ? (
                    <View style={[detailStyles.row, { marginTop: 8 }]}> 
                      <Text style={detailStyles.label}>Address:</Text>
                      <Text style={[detailStyles.value, { flex: 1 }]}> 
                        {fullDetail?.address ?? fullDetail?.business_partner_address}
                      </Text>
                    </View>
                  ) : null}
                </ScrollView>

                <TouchableOpacity style={detailStyles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={detailStyles.closeText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },

  formWrapper: {
    width: "100%",
    maxWidth: 360,
  },

  headerRow: {
    marginBottom: 8,
  },
  nameWrap: {
    flex: 1,
  },
  smallLabel: {
    fontSize: 12,
    color: "#333",
    marginBottom: 6,
    fontWeight: "600",
  },
  nameInput: {
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    fontWeight: "700",
    backgroundColor: "#fff",
  },

  statusBox: {
    backgroundColor: "#fff6e6",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f0c27a",
  },
  statusText: {
    color: "#b35b00",
    fontWeight: "600",
    fontSize: 13,
  },

  compactGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#111",
    marginBottom: 6,
    fontWeight: "600",
  },
  compactInput: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#eaf2ff",
    fontSize: 15,
  },
  deliveryInput: {
    borderWidth: 1,
    borderColor: "#111",
    backgroundColor: "#fff",
  },

  updateButton: {
    backgroundColor: "#2f6cf3",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  updateButtonDisabled: {
    opacity: 0.7,
  },
  updateText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  bottomRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fixedWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  fixedText: {
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 13,
  },
  viewMore: {
    color: "#1565d8",
    textDecorationLine: "underline",
    fontWeight: "600",
    fontSize: 13,
  },

  topHeader: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  topBack: {
    width: 44,
    alignItems: "flex-start",
    justifyContent: "center",
    padding: 4,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  topProfile: {
    width: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});

/* Modal / details card styles */
const detailStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 560,
    backgroundColor: "#2f6cf3",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    // drop shadow (iOS + Android)
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  row: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    alignItems: "center",
  },
  label: {
    color: "#e8f0ff",
    fontSize: 15,
    fontWeight: "600",
  },
  value: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  closeButton: {
    marginTop: 14,
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  closeText: {
    color: "#2f6cf3",
    fontWeight: "700",
    fontSize: 15,
  },
});
