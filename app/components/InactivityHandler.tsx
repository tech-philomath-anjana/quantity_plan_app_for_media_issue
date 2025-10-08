// InactivityHandler

// Wraps around app content and auto-signs the user out after inactivity.
// - Timer resets when the app comes back to the foreground
// - Defaults to 60 minutes timeout 

import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "../context/AuthContext";

const INACTIVITY_MS = 60 * 60 * 1000; // 60 minutes

export default function InactivityHandler({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const startTimer = () => {
      // clear any existing timer before starting a new one
      if (timerRef.current) clearTimeout(timerRef.current);

      // schedule auto sign-out
      timerRef.current = setTimeout(async () => {
        try {
          await signOut();
        } catch (err) {
          console.warn("Inactivity signOut error", err);
        }
      }, INACTIVITY_MS);
    };

    // start inactivity timer on mount
    startTimer();

    // listen for app state changes to reset or stop the timer
    const handleAppState = (next: AppStateStatus) => {
      if (next === "active") {
        // reset inactivity timer when app comes back into focus
        startTimer();
      }
      // If you want to log out immediately when backgrounded, uncomment:
      // else if (next === "background") signOut();
    };

    const sub = AppState.addEventListener("change", handleAppState);

    return () => {
      // cleanup on unmount
      if (timerRef.current) clearTimeout(timerRef.current);
      sub.remove();
    };
  }, [signOut]);

  return <>{children}</>;
}

