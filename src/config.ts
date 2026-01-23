// Temporary test config: use the server IP over HTTP so installed APK on the
// emulator/device can reach the backend while we wait for a real DNS+TLS setup.
// IMPORTANT: revert this to a proper HTTPS hostname (and set usesCleartextTraffic
// to false) before making any production builds.
export const API_BASE = "http://13.126.182.69/api";
