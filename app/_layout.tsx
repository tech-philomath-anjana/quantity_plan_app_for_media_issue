// Root layout for the app
// - Wraps navigation with AuthProvider (auth state available everywhere)
// - Adds InactivityHandler for auto-logout / session handling
// - Uses expo-router's Stack with headers hidden globally

import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "../src/context/AuthContext";
import InactivityHandler from "./components/InactivityHandler";

export default function RootLayout() {
  return (
    <AuthProvider>
      {/* Handles session timeout and auto-logout */}
      <InactivityHandler>
        {/* Global navigation stack (headers hidden by default) */}
        <Stack screenOptions={{ headerShown: false }} />
      </InactivityHandler>
    </AuthProvider>
  );
}
