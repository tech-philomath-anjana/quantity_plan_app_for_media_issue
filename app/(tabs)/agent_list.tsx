import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config";
import UserProfile from "../components/UserProfile";

// A single row returned by the server for the agent/detail list.
type AgentRow = {
  product_code: string;
  media_issue: string;
  contract_no: string;
  publication_date: string;
  item_no: number;
  sales_contract_item_cat: string;
  delivery_qty?: number;
  business_partner_fullname?: string;
  item_cat_desc?: string;
  phase_no?: number;
};

/**
 * AgentListScreen

 * Displays a searchable list of "agents" (server-provided rows) for a
 * given product/date/phase. Clicking an item navigates to an update screen.
 * Features:
 *  - Filters come from the route's query params (useLocalSearchParams).
 *  - If required filters are missing we show an Alert and bail out.
 *  - The list supports in-memory search by agent name.
 */

export default function AgentListScreen(): JSX.Element {
  const router = useRouter();
  const { authFetch } = useAuth();

  // route params (received as strings when present)
  const { product_code, publication_date, phase_no } =
    useLocalSearchParams<{ product_code?: string; publication_date?: string; phase_no?: string }>();

  // ----- Local UI state -----
  const [searchQuery, setSearchQuery] = useState("");
  const [rows, setRows] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Normalize the incoming filters once per render.
  // These mirror the original app's behavior: trim whitespace and default the phase to "10".
  const filterProduct = (product_code ?? "").trim();
  const filterDate = (publication_date ?? "").trim();
  const filterPhase = (phase_no ?? "10").toString().trim();

  // Fetch rows from server whenever the filters or authFetch change.
  useEffect(() => {
    let cancelled = false; // defensive: avoid state updates if unmounted

    async function fetchData() {
      setLoading(true);

      try {
        // If a caller navigated to this screen without specifying product/date, there's nothing to fetch.
        if (!filterProduct || !filterDate) {
          Alert.alert("Missing filters", "Go back and choose media product and date.");
          return;
        }

        const payload = { product_code: filterProduct, publication_date: filterDate, phase_no: filterPhase };
        // Helpful log for debugging (kept from original).
        // eslint-disable-next-line no-console
        console.log("POST /mobapp_get_detail_view", payload);

        const res = await authFetch(`${API_BASE}/mobapp_get_detail_view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (!res.ok || json?.failed) {
          // Throw an error that will be shown to the user in the catch block below.
          throw new Error(json?.message ?? "Failed to fetch agents");
        }

        const serverRows: AgentRow[] = Array.isArray(json?.data) ? json.data : [];

        // Even though the server is expected to respect the filters, we re-apply them strictly
        // to protect the UI from inconsistent server responses.
        const strictlyFiltered = serverRows.filter((r) => {
          const matchProduct = String(r.product_code).trim() === filterProduct;
          const matchDate = String(r.publication_date).trim() === filterDate;
          const matchPhase = String(r.phase_no ?? "").trim() === filterPhase;
          return matchProduct && matchDate && matchPhase;
        });

        if (!cancelled) setRows(strictlyFiltered);
      } catch (e: any) {
        // Show an error message to the user.
        Alert.alert("Error", e?.message ?? "Failed to load list");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // Trigger fetch immediately.
    fetchData();

    // Cleanup guard for the async operation.
    return () => {
      cancelled = true;
    };
  }, [authFetch, filterProduct, filterDate, filterPhase]);

  // Filter rows locally by the searchQuery (agent name). useMemo avoids unnecessary re-calculation.
  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((item) => (item.business_partner_fullname || "").toLowerCase().includes(q));
  }, [searchQuery, rows]);

  // Navigate to the update screen for an item. We stringify values to keep the route params simple.
  const goToUpdate = (row: AgentRow) => {
    router.push({
      pathname: "/agent_records_update",
      params: {
        contract_no: String(row.contract_no),
        item_no: String(row.item_no),
        product_code: row.product_code,
        publication_date: row.publication_date,
        media_issue: row.media_issue || "",
        delivery_qty: String(row.delivery_qty ?? ""),
      },
    });
  };

  // Helper: format the delivery quantity for display. If empty/undefined, show a dash.
  const formatQty = (q?: number | string) => {
    if (q == null || q === "") return "-";
    return String(q);
  };

  // Render a single row in the FlatList.
  const renderItem = ({ item }: { item: AgentRow }) => {
    const qtyRaw = formatQty(item.delivery_qty);

    // if the quantity string is long (>= 4 characters) we use a smaller font to help fit into the box
    const isLongNumber = qtyRaw.length >= 4;
    const qtyNumberStyle = isLongNumber ? styles.qtyNumberSmall : styles.qtyNumber;

    return (
      <TouchableOpacity
        onPress={() => goToUpdate(item)}
        activeOpacity={0.85}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.business_partner_fullname ?? "agent"}`}
      >
        <View style={styles.cardLeft}>
          <Text style={styles.agentName} numberOfLines={1} accessibilityLabel="Agent name">
            {item.business_partner_fullname ?? "-"}
          </Text>

          <View style={styles.metaGroup}>
            <Text style={styles.metaLabel}>Contract No: </Text>
            <Text style={styles.metaLink} numberOfLines={1}>
              {item.contract_no ?? "-"}
            </Text>
          </View>

          <View style={styles.metaGroup}>
            <Text style={styles.metaLabel}>Item No: </Text>
            <Text style={styles.metaLink}>{item.item_no ?? "-"}</Text>
          </View>

          <View style={styles.metaGroup}>
            <Text style={styles.metaLabel}>Item Category: </Text>
            <Text style={styles.metaLink}>{item.sales_contract_item_cat ?? "-"}</Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <View style={styles.qtyBox}>
            <Text style={qtyNumberStyle} numberOfLines={1} adjustsFontSizeToFit>
              {qtyRaw}
            </Text>
            <Text style={styles.qtyLabel}>Delivery{"\n"}Quantity</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Key extractor guards against undefined values by falling back to stable defaults.
  const keyExtractor = (item: AgentRow) => `${item.contract_no ?? "c"}_${item.item_no ?? "i"}`;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {/* === Top header: Back + Search/Status + UserProfile === */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Back">
            <Ionicons name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"} size={22} color="#111827" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.searchPill}>
              <Ionicons name="search" size={18} color="#6b7280" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by agent name"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                accessible
                accessibilityLabel="Search agents"
              />
            </View>

            <View style={styles.statusPill}>
              <Text style={styles.statusText}>Status: Pre freeze print order</Text>
            </View>
          </View>

          <View style={styles.profileWrap}>
            <UserProfile />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
            ListEmptyComponent={
              <View style={{ padding: 24 }}>
                <Text>No agents found for this media product/date/phase.</Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// -------
// Styles 
// -------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  /* Header */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 6,
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  header: { flex: 1, paddingHorizontal: 8 },
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    height: 20,
    fontSize: 16,
    color: "#111827",
  },
  statusPill: {
    alignSelf: "stretch",
    marginTop: 10,
    backgroundColor: "#fff7ed",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fde3bf",
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: { color: "#92400e", fontSize: 12 },

  profileWrap: {
    width: 56,
    alignItems: "flex-end",
    paddingRight: 6,
  },

  /* Card */
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "#e6eef9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardLeft: {
    flex: 1,
    paddingRight: 12,
  },
  agentName: { fontSize: 18, fontWeight: "800", marginBottom: 6, color: "#0f172a" },

  metaGroup: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  metaLabel: { fontSize: 13, color: "#6b7280" },
  metaLink: { fontSize: 13, color: "#2563eb", fontWeight: "700" },

  cardRight: {
    width: 110,
    alignItems: "center",
    justifyContent: "center",
  },

  qtyBox: {
    width: 92,
    height: 92,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    elevation: 3,
    shadowColor: "#1e40af",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  qtyNumber: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 34,
  },
  // smaller variant used when number length is >= 4
  qtyNumberSmall: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 22,
  },
  qtyLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#e6f0ff",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 13,
  },

  /* Misc */
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },
});
