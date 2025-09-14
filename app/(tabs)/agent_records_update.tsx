// Agent Records Update Screen
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

export default function SupplyForm() {
  const [baseSupply, setBaseSupply] = useState("");
  const [nightCorrections, setNightCorrections] = useState("");
  const [daysFigure, setDaysFigure] = useState("");
  const [extraQuantity, setExtraQuantity] = useState("");
  const [deliveryQuantity, setDeliveryQuantity] = useState("101");
  const [fixedQty, setFixedQty] = useState(true);

  const handleUpdate = () => {
    // call your API or perform whatever action you need
    console.log({
      baseSupply,
      nightCorrections,
      daysFigure,
      extraQuantity,
      deliveryQuantity,
      fixedQty,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value="Ganesh" editable={false} />

      <View style={styles.statusBox}>
        <Text style={styles.statusText}>Status: Pre freeze print order</Text>
      </View>

      <Text style={styles.label}>Base Supply</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={baseSupply}
        onChangeText={setBaseSupply}
      />

      <Text style={styles.label}>Night Corrections</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={nightCorrections}
        onChangeText={setNightCorrections}
      />

      <Text style={styles.label}>Days Figure</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={daysFigure}
        onChangeText={setDaysFigure}
      />

      <Text style={styles.label}>Extra Quantity</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={extraQuantity}
        onChangeText={setExtraQuantity}
      />

      <Text style={styles.label}>Delivery Quantity</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={deliveryQuantity}
        onChangeText={setDeliveryQuantity}
      />

      <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
        <Text style={styles.updateText}>Update</Text>
      </TouchableOpacity>

      <View style={styles.checkboxRow}>
        <Text style={{ marginLeft: 8 }}>Fixed Qty</Text>
      </View>

      <TouchableOpacity>
        <Text style={styles.link}>View More Details</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  label: {
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 4,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
  },
  statusBox: {
    backgroundColor: "#ffe7d1",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    marginTop: 12,
  },
  statusText: {
    color: "#d9822b",
  },
  updateButton: {
    backgroundColor: "#007bff",
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  updateText: {
    color: "#fff",
    fontWeight: "600",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  link: {
    color: "#007bff",
    marginTop: 12,
    textAlign: "right",
  },
});
