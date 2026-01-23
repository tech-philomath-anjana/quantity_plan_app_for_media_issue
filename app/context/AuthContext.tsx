// Moved to src/context/AuthContext.tsx to keep expo-router routing tree clean.
// Re-export hooks/providers for any legacy imports and provide a dummy default export
// so expo-router doesn't error about missing default components.
export { AuthProvider, useAuth } from "../../src/context/AuthContext";

export default function HiddenAuthRoute() {
  return null;
}
