import { lexer } from "@/src/prolog/pl/lexer";
import { router, Slot } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { prologEngine } from "../src/prolog/PrologEngine";

export default function RootLayout() {
  const [prologReady, setPrologReady] = useState(false);
  const [prologError, setPrologError] = useState<string | null>(null);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    async function init() {
      try {
        await prologEngine.loadPrograms([lexer]);
        setPrologReady(true);
        router.replace("/");
      } catch (e: any) {
        console.warn("Init error:", e.message);
        setPrologError(e.message);
        setPrologReady(true);
      } finally {
        setAppReady(true);
      }
    }
    init();
  }, []);

  if (!appReady) return null;

  return (
    <View style={styles.root}>
      <Slot />
      {!prologReady && !prologError && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Iniciando motor Prolog...</Text>
        </View>
      )}
      {prologError && (
        <View style={[styles.overlay, styles.overlayError]}>
          <Text style={styles.errorText}>
            Error Prolog:{"\n"}
            {prologError}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },
  overlayError: { backgroundColor: "rgba(80,0,0,0.88)" },
  loadingText: { color: "#fff", fontSize: 14 },
  errorText: {
    color: "#ff6b6b",
    fontSize: 13,
    textAlign: "center",
    padding: 24,
  },
});
