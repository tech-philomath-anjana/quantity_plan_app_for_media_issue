// Agent list screen with search and quick navigation to record update

import React, { useMemo, useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import UserProfile from "../components/UserProfile";

interface AgentData {
  id: string;
  agentName: string;
  contractNo: string;
  itemNo: string;
  itemCategory: string;
  deliveryQuantity: number;
}

/* Placeholder data — replace with API/store data later */
const initialData: AgentData[] = [
  { id: "1", agentName: "Ganesh", contractNo: "40000000", itemNo: "50", itemCategory: "KMN", deliveryQuantity: 101 },
  { id: "2", agentName: "Thomas", contractNo: "40000005", itemNo: "30", itemCategory: "KMN", deliveryQuantity: 50 },
  { id: "3", agentName: "Shaam", contractNo: "40000024", itemNo: "10", itemCategory: "KMN", deliveryQuantity: 50 },
];

export default function AgentListScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryData] = useState<AgentData[]>(initialData);

  // memoize filtered list to avoid re-filtering on unrelated renders
  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return deliveryData;
    return deliveryData.filter((item) => item.agentName.toLowerCase().includes(q));
  }, [searchQuery, deliveryData]);

  const goToUpdate = (id: string) => {
    // navigate to agent_records_update with the selected id
    router.push({ pathname: "/agent_records_update", params: { id } });
  };

  const renderItem = ({ item }: { item: AgentData }) => (
    <View style={styles.itemContainer}>
      <View style={styles.detailsContainer}>
        <Text style={styles.agentName}>{item.agentName}</Text>
        <Text style={styles.detailText}>
          Contract No: <Text style={styles.detailValue}>{item.contractNo}</Text>
        </Text>
        <Text style={styles.detailText}>
          Item No: <Text style={styles.detailValue}>{item.itemNo}</Text>
        </Text>
        <Text style={styles.detailText}>
          Item Category: <Text style={styles.detailValue}>{item.itemCategory}</Text>
        </Text>
      </View>

      <TouchableOpacity
        style={styles.quantityButton}
        onPress={() => goToUpdate(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.agentName} record`}
      >
        <Text style={styles.quantityText}>{item.deliveryQuantity}</Text>
        <Text style={styles.quantityLabel}>Delivery Quantity</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top-right profile (renders its own layout) */}
      <UserProfile />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={18} color="black" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search by agent name"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            accessible
            accessibilityLabel="Search agents"
          />
        </View>

        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No agents found</Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },

  /* Search */
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6E9EE",
    borderRadius: 25,
    marginBottom: 12,
    paddingHorizontal: 14,
    width: "90%",
    alignSelf: "center",
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchBar: { flex: 1, fontSize: 16, height: "100%" },

  listContent: { paddingBottom: 20 },

  /* Item */
  itemContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(179,208,252,1)",
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "95%",
    alignSelf: "center",
    elevation: 2,
  },
  detailsContainer: { flex: 1, paddingRight: 12 },
  agentName: { fontSize: 20, fontWeight: "600", marginBottom: 6 },
  detailText: { fontSize: 15, color: "#111", marginBottom: 2 },
  detailValue: { color: "rgba(24,115,255,1)", fontWeight: "500" },

  /* Quantity button */
  quantityButton: {
    backgroundColor: "rgba(24,115,255,1)",
    borderRadius: 12,
    width: 92,
    height: 92,
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
  },
  quantityText: { color: "#fff", fontSize: 26, fontWeight: "700" },
  quantityLabel: { color: "#fff", fontSize: 12, textAlign: "center" },

  /* Empty state */
  emptyContainer: { marginTop: 40, alignItems: "center" },
  emptyText: { color: "#666" },
});
