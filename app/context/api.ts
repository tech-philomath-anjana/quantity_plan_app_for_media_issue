// Moved to src/context/api.ts to keep expo-router routing tree clean.
// Re-export helpers for any legacy imports and provide a dummy default export
// so expo-router doesn't error about missing default components.
export * from "../../src/context/api";

export default function HiddenApiRoute() {
  return null;
}
