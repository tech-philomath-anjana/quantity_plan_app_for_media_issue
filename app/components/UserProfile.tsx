//UserProfile.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

/**
 * Simple profile / menu component:
 * - Tapping the avatar opens the menu
 * - "Details" is shown but intentionally disabled (greyed out)
 * - "Logout" calls signOut() from AuthContext
 */

export default function UserProfile() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const initials = (user?.first_name || "U")
    .toString()
    .charAt(0)
    .toUpperCase();

  return (
    <View>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={styles.avatarButton}
        accessibilityLabel="User menu"
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.menuWrapper}>
          <View style={styles.menuCard}>
            <Text style={styles.userName}>
              {user ? `${user.first_name} ${user.last_name ?? ""}` : "User"}
            </Text>

            {/* Details - greyed out / disabled */}
            <View style={styles.menuItemDisabled}>
              <Text style={styles.menuItemDisabledText}>Details (coming soon)</Text>
            </View>

            {/* Logout */}
            <TouchableOpacity
              onPress={async () => {
                setOpen(false);
                try {
                  await signOut();
                } catch (e) {
                  // signOut handles its own errors
                }
              }}
              style={styles.menuItem}
            >
              <Ionicons name={Platform.OS === "ios" ? "log-out-outline" : "exit-outline"} size={18} />
              <Text style={styles.menuItemText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarButton: {
    padding: 6,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "700",
    color: "#333",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  menuWrapper: {
    position: "absolute",
    right: 12,
    top: Platform.OS === "ios" ? 64 : 56,
    width: 220,
  },
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  userName: {
    fontWeight: "700",
    marginBottom: 10,
    color: "#111",
    fontSize: 15,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 8,
  },
  menuItemText: {
    color: "#111",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
  menuItemDisabled: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  menuItemDisabledText: {
    color: "#999",
    fontWeight: "600",
    fontSize: 14,
  },
});
