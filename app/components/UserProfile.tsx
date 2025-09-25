// UserProfile

// Small profile/avatar menu shown in the top-right corner of screens.
// - Displays user initials inside a circle
// - Opens a simple dropdown menu with:
//    • User name
//    • "Details" (disabled placeholder for now)
//    • Logout (calls signOut from AuthContext)

import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

export default function UserProfile(): JSX.Element {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  // derive initials (fallback to "?")
  const initials = user
    ? `${(user.first_name || "").charAt(0)}${(user.last_name || "").charAt(0)}`.toUpperCase()
    : "?";

  const handleSignOut = async () => {
    setOpen(false);
    try {
      await signOut(); // AuthContext should handle redirect and cleanup
    } catch (err) {
      console.warn("Sign out failed", err);
      Alert.alert("Logout failed", "Please try again.");
    }
  };

  return (
    <View style={[styles.container, { top: Math.max(8, insets.top + 6) }]}>
      {/* Avatar button */}
      <TouchableOpacity
        style={styles.avatar}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Open profile menu"
      >
        <Text style={styles.initials}>{initials}</Text>
      </TouchableOpacity>

      {/* Dropdown menu (modal overlay) */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.menuWrapper} pointerEvents="box-none">
            <View style={styles.menu}>
              {/* User name */}
              <Text style={styles.userName}>
                {user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "Guest"}
              </Text>

              {/* Disabled "Details" option (placeholder for future) */}
              <View style={[styles.menuItem, styles.disabledItem]}>
                <Text style={[styles.menuItemText, styles.disabledText]}>
                  Details (coming soon)
                </Text>
              </View>

              {/* Logout option */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleSignOut}
                accessibilityRole="button"
                accessibilityLabel="Logout"
              >
                <Text style={styles.menuItemText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 12,
    zIndex: 50,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(24,115,255,1)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  initials: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menuWrapper: {
    width: 220,
    marginTop: Platform.OS === "ios" ? 70 : 54,
    marginRight: 12,
  },
  menu: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  userName: {
    fontWeight: "600",
    marginBottom: 8,
    fontSize: 14,
    color: "#222",
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 16,
    color: "#222",
  },
  disabledItem: {
    opacity: 0.55,
  },
  disabledText: {
    color: "#777",
  },
});
