// Moved to src/config.ts to keep expo-router routing tree clean.
// Re-export for any legacy imports and provide a dummy default export so
// expo-router doesn't warn about missing default route component.
export { API_BASE } from "../src/config";

export default function HiddenConfigRoute() {
	return null;
}
