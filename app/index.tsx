import { PrologService } from "@/utils/PrologService";
import { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const prologService = new PrologService();

const INITIAL_CODE = `int numero = 123;
float x = 4.5;
if (numero > x) {
    printf("Número: :%d", numero);
} else {
    y = 10;
}`;

type Lexeme = { lexema: string; componente: string };
type Symbol = {
  identificador: string;
  tipo: string;
  valor: string;
  posicion: number;
};
type LexError = { message: string };

export default function Index() {
  const [code, setCode] = useState(INITIAL_CODE);
  const [lexemes, setLexemes] = useState<Lexeme[]>([]);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [errors, setErrors] = useState<LexError[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAnalysis = async () => {
    setLoading(true);

    await prologService.tokenize(code);

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Análisis Léxico</Text>
        </View>

        {/* Top row */}
        <View style={styles.row}>
          {/* Code Editor */}
          <View style={[styles.card, styles.flex2]}>
            <Text style={styles.cardTitle}>
              Editor de Código (Zona de Entrada)
            </Text>
            <TextInput
              style={styles.codeInput}
              multiline
              value={code}
              onChangeText={setCode}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              textAlignVertical="top"
              placeholderTextColor="#888"
              placeholder="Escribe o pega tu código aquí..."
            />
          </View>

          {/* Errors */}
          <View style={[styles.card, styles.flex1]}>
            <Text style={styles.cardTitle}>Zona de Errores Léxicos</Text>
            <ScrollView style={styles.errorScroll}>
              {errors.length === 0 ? (
                <Text style={styles.emptyText}>Sin errores</Text>
              ) : (
                errors.map((e, i) => (
                  <View key={i} style={styles.errorRow}>
                    <Text style={styles.errorDot}>●</Text>
                    <Text style={styles.errorText}>{e.message}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>

        {/* Bottom row */}
        <View style={styles.row}>
          {/* Lexemes Table */}
          <View style={[styles.card, styles.flex1]}>
            <Text style={styles.cardTitle}>
              Zona de Lexemas y Componentes Léxicos
            </Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.flex1]}>Lexema</Text>
              <Text style={[styles.tableHeaderCell, styles.flex1]}>
                Componente Léxico
              </Text>
            </View>
            <ScrollView style={styles.tableScroll}>
              {lexemes.length === 0 ? (
                <Text style={styles.emptyText}>Sin resultados</Text>
              ) : (
                lexemes.map((l, i) => (
                  <View
                    key={i}
                    style={[
                      styles.tableRow,
                      i % 2 === 0 && styles.tableRowEven,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tableCell,
                        styles.flex1,
                        styles.codeFontCell,
                      ]}
                    >
                      {l.lexema}
                    </Text>
                    <Text
                      style={[styles.tableCell, styles.flex1, styles.tagCell]}
                    >
                      {l.componente}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>

          {/* Symbols Table */}
          <View style={[styles.card, styles.flex1]}>
            <Text style={styles.cardTitle}>Tabla de Símbolos</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.flex1]}>
                Identificador
              </Text>
              <Text style={[styles.tableHeaderCell, styles.flex1]}>Tipo</Text>
              <Text style={[styles.tableHeaderCell, styles.flex1]}>Valor</Text>
              <Text style={[styles.tableHeaderCell, styles.flex1]}>
                Posición
              </Text>
            </View>
            <ScrollView style={styles.tableScroll}>
              {symbols.length === 0 ? (
                <Text style={styles.emptyText}>Sin símbolos</Text>
              ) : (
                symbols.map((s, i) => (
                  <View
                    key={i}
                    style={[
                      styles.tableRow,
                      i % 2 === 0 && styles.tableRowEven,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tableCell,
                        styles.flex1,
                        styles.codeFontCell,
                      ]}
                    >
                      {s.identificador}
                    </Text>
                    <Text style={[styles.tableCell, styles.flex1]}>
                      {s.tipo}
                    </Text>
                    <Text style={[styles.tableCell, styles.flex1]}>
                      {s.valor}
                    </Text>
                    <Text
                      style={[styles.tableCell, styles.flex1, styles.center]}
                    >
                      {s.posicion}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAnalysis}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? "Analizando..." : "Análisis Léxico"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const FONT_MONO = Platform.OS === "ios" ? "Menlo" : "monospace";
const FONT_UI = Platform.OS === "ios" ? "System" : "sans-serif";

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  container: {
    padding: 12,
    gap: 10,
  },
  header: {
    backgroundColor: "#e8e8e8",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    alignItems: "center",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1a1a1a",
    fontFamily: FONT_UI,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d8d8d8",
    padding: 10,
    minHeight: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    fontFamily: FONT_UI,
    letterSpacing: 0.1,
  },
  flex1: { flex: 1 },
  flex2: { flex: 2 },

  // Code editor
  codeInput: {
    flex: 1,
    minHeight: 150,
    fontFamily: FONT_MONO,
    fontSize: 13,
    color: "#1a1a1a",
    lineHeight: 20,
    backgroundColor: "#fafafa",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 8,
  },

  // Errors
  errorScroll: { flex: 1 },
  errorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    gap: 4,
  },
  errorDot: { color: "#e53e3e", fontSize: 10, marginTop: 2 },
  errorText: {
    fontFamily: FONT_MONO,
    fontSize: 12,
    color: "#c53030",
    flex: 1,
  },
  emptyText: {
    fontSize: 12,
    color: "#aaa",
    fontStyle: "italic",
    fontFamily: FONT_UI,
    textAlign: "center",
    marginTop: 16,
  },

  // Tables
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: "700",
    color: "#444",
    padding: 6,
    fontFamily: FONT_UI,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
  },
  tableScroll: { flex: 1 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tableRowEven: {
    backgroundColor: "#f9f9f9",
  },
  tableCell: {
    fontSize: 12,
    color: "#222",
    padding: 5,
    fontFamily: FONT_UI,
    borderRightWidth: 1,
    borderRightColor: "#eee",
  },
  codeFontCell: {
    fontFamily: FONT_MONO,
    fontSize: 12,
    color: "#2b4f8e",
  },
  tagCell: {
    color: "#6b4c00",
    fontWeight: "500",
  },
  center: { textAlign: "center" },

  // Button
  buttonRow: {
    alignItems: "flex-end",
    marginTop: 4,
    paddingBottom: 8,
  },
  button: {
    backgroundColor: "#4a4a4a",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: "#999",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: FONT_UI,
    letterSpacing: 0.2,
  },
});
