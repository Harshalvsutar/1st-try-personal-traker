import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.focusgrove",
  appName: "FocusGrove",
  webDir: "public",
  server: {
    // Loads the published app; its offline cache keeps it working without internet after first open.
    url: "https://growth-hatch-track.lovable.app",
    cleartext: false,
  },
  android: { backgroundColor: "#0d1117" },
};

export default config;
