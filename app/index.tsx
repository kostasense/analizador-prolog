import { Lexeme, PrologService, SymbolRow } from "@/utils/PrologService";
import * as DocumentPicker from "expo-document-picker";
import { useRef, useState } from "react";
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

const EDITOR_FONT_SIZE = 13;
const EDITOR_LINE_HEIGHT = 20;
const EDITOR_PADDING = 8;
const FONT_MONO = Platform.OS === "ios" ? "Menlo" : "monospace";
const FONT_UI = Platform.OS === "ios" ? "System" : "sans-serif";

const CHAR_WIDTH = EDITOR_FONT_SIZE * 0.601;

//  A) junto a "TOKEN" (Línea N)          — errores en main/funciones
//  B) junto a "TOKEN" en la línea N      — firma/estructura incorrecta
//  C) ("TOKEN") en la línea N            — elemento global fuera de lugar
//  D) Token desconocido: "TOKEN" en la línea N — error léxico
//  E) (Línea N) sin token                — firma de función sin token claro
//  F) en la línea N sin token            — balanceo de llaves
//  G) sin número de línea                — falta int main(void), nada que marcar
const getErrorInfo = (errors: string[]) => {
  if (!errors?.length) return null;

  const err = errors[errors.length - 1];

  let lineMatch = err.match(/\(L[íi]nea\s+(\d+)\)/i);
  if (!lineMatch) lineMatch = err.match(/en\s+la\s+l[íi]nea\s+(\d+)/i);
  if (!lineMatch) return null;

  const line = parseInt(lineMatch[1], 10);

  let tokenMatch = err.match(/junto\s+a\s+"([^"]+)"/i);
  if (!tokenMatch) tokenMatch = err.match(/\("([^"]+)"\)/);
  if (!tokenMatch) tokenMatch = err.match(/desconocido:\s*"([^"]+)"/i);
  if (!tokenMatch) tokenMatch = err.match(/cerca\s+de\s+"([^"]+)"/i);

  return {
    line,
    token: tokenMatch?.[1] ?? null,
  };
};

export default function Index() {
  const [code, setCode] = useState(INITIAL_CODE);
  const [lexemes, setLexemes] = useState<Lexeme[]>([]);
  const [symbols, setSymbols] = useState<SymbolRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"lexico" | "sintactico">("lexico");
  const textInputRef = useRef<TextInput>(null);

  const handleAnalysis = async () => {
    setLoading(true);
    try {
      const {
        lexemes: lex,
        symbols: syms,
        errors: errs,
      } = mode === "lexico"
        ? await prologService.getLexicalAnalysis(code)
        : await prologService.getFullAnalysis(code);

      setLexemes(lex);
      setSymbols(syms);
      setErrors(errs);
    } catch (err) {
      setErrors(["Error de comunicación con el motor de análisis."]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const file = result.assets[0];
    const response = await fetch(file.uri);
    const content = await response.text();
    setCode(content);
  };

  const errorInfo = getErrorInfo(errors);
  const lines = code.split("\n");
  const isFuncion = (s: SymbolRow) => s.categoria === "funcion";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analizador Léxico / Sintáctico</Text>
        </View>

        {/* Mode selector */}
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === "lexico" && styles.modeBtnActive]}
            onPress={() => setMode("lexico")}
          >
            <Text
              style={[
                styles.modeBtnText,
                mode === "lexico" && styles.modeBtnTextActive,
              ]}
            >
              Léxico
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              mode === "sintactico" && styles.modeBtnActive,
            ]}
            onPress={() => setMode("sintactico")}
          >
            <Text
              style={[
                styles.modeBtnText,
                mode === "sintactico" && styles.modeBtnTextActive,
              ]}
            >
              Sintáctico
            </Text>
          </TouchableOpacity>
        </View>

        {/* Top row: Editor & Errors */}
        <View style={styles.row}>
          <View style={[styles.card, styles.flex2, styles.editorCardFix]}>
            <Text style={styles.cardTitleInternal}>
              Editor de Código (Zona de Entrada)
            </Text>

            <ScrollView
              style={styles.innerEditorScroll}
              contentContainerStyle={styles.innerEditorContent}
            >
              <View style={styles.editorFlexRow}>
                <View style={styles.gutterContainer}>
                  {lines.map((_, i) => {
                    const isErrorLine = errorInfo && errorInfo.line === i + 1;
                    return (
                      <Text
                        key={i}
                        style={[
                          styles.gutterText,
                          isErrorLine && styles.gutterTextError,
                        ]}
                      >
                        {i + 1}
                      </Text>
                    );
                  })}
                </View>

                {/* Contenedor interactivo que abarca todo el espacio disponible */}
                <TouchableOpacity
                  style={styles.textareaWorkspace}
                  activeOpacity={1}
                  onPress={() => textInputRef.current?.focus()}
                >
                  {errorInfo &&
                    (() => {
                      const errorLineIndex = errorInfo.line - 1;
                      const lineText = lines[errorLineIndex] ?? "";
                      const TAB_WIDTH = 4;

                      const topOffset =
                        EDITOR_PADDING +
                        errorLineIndex * EDITOR_LINE_HEIGHT +
                        EDITOR_LINE_HEIGHT -
                        2;

                      let leftOffset: number;
                      let underlineWidth: number;

                      if (errorInfo.token) {
                        const tokenIndex = lineText.indexOf(errorInfo.token);
                        if (tokenIndex === -1) return null;

                        const textBefore = lineText.substring(0, tokenIndex);
                        const tabs = (textBefore.match(/\t/g) || []).length;
                        const visualBefore =
                          textBefore.length - tabs + tabs * TAB_WIDTH;

                        leftOffset = EDITOR_PADDING + visualBefore * CHAR_WIDTH;
                        underlineWidth = errorInfo.token.length * CHAR_WIDTH;
                      } else {
                        const trimmedStart = lineText.search(/\S/);
                        if (trimmedStart === -1) return null;

                        const textBefore = lineText.substring(0, trimmedStart);
                        const tabs = (textBefore.match(/\t/g) || []).length;
                        const visualBefore =
                          textBefore.length - tabs + tabs * TAB_WIDTH;

                        const trimmedText = lineText.trimEnd();
                        const tabsInLine = (trimmedText.match(/\t/g) || [])
                          .length;
                        const visualWidth =
                          trimmedText.length -
                          tabsInLine +
                          tabsInLine * TAB_WIDTH -
                          visualBefore;

                        leftOffset = EDITOR_PADDING + visualBefore * CHAR_WIDTH;
                        underlineWidth = visualWidth * CHAR_WIDTH;
                      }

                      return (
                        <View
                          pointerEvents="none"
                          style={[
                            styles.tokenUnderline,
                            {
                              top: topOffset,
                              left: leftOffset,
                              width: underlineWidth,
                            },
                          ]}
                        />
                      );
                    })()}

                  <TextInput
                    ref={textInputRef}
                    style={styles.codeInput}
                    multiline={true}
                    scrollEnabled={false}
                    value={code}
                    onChangeText={setCode}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    textAlignVertical="top"
                    placeholderTextColor="#888"
                    placeholder="Escribe o pega tu código aquí..."
                    selectionColor="#4a90d9"
                  />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          {/* Panel de errores */}
          <View style={[styles.card, styles.flex1]}>
            <Text style={styles.cardTitle}>
              {mode === "lexico"
                ? "Zona de Errores Léxicos"
                : "Zona de Errores (Léxicos / Sintácticos)"}
            </Text>
            <ScrollView style={styles.errorScroll}>
              {errors.length === 0 ? (
                <Text style={styles.emptyText}>Sin errores</Text>
              ) : (
                errors.map((errorMsg, i) => (
                  <View key={i} style={styles.errorRow}>
                    <Text style={styles.errorDot}>●</Text>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>

        {/* Bottom row: Lexemes & Symbols Tables */}
        <View style={styles.row}>
          {/* Tabla de lexemas */}
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

          {/* Tabla de símbolos */}
          <View style={[styles.card, styles.flex1]}>
            <Text style={styles.cardTitle}>Tabla de Símbolos</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>
                Nombre
              </Text>
              <Text style={[styles.tableHeaderCell, styles.flex1]}>Cat.</Text>
              <Text style={[styles.tableHeaderCell, styles.flex1]}>Tipo</Text>
              <Text style={[styles.tableHeaderCell, styles.flex1]}>Valor</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>
                Params
              </Text>
              <Text style={[styles.tableHeaderCell, { flex: 0.6 }]}>Pos.</Text>
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
                      isFuncion(s) && styles.tableRowFun,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tableCell,
                        { flex: 1.2 },
                        styles.codeFontCell,
                      ]}
                    >
                      {s.nombre}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.flex1,
                        isFuncion(s) ? styles.catFun : styles.catVar,
                      ]}
                    >
                      {s.categoria}
                    </Text>
                    <Text style={[styles.tableCell, styles.flex1]}>
                      {s.tipo}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.flex1,
                        s.valor === "-" && styles.dash,
                      ]}
                    >
                      {s.valor}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { flex: 1.4 },
                        styles.codeFontCell,
                        s.parametros === "-" && styles.dash,
                      ]}
                    >
                      {s.parametros}
                    </Text>
                    <Text
                      style={[styles.tableCell, { flex: 0.6 }, styles.center]}
                    >
                      {s.posicion}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleUpload}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Subir Archivo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAnalysis}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading
                ? "Analizando..."
                : mode === "lexico"
                  ? "Análisis Léxico"
                  : "Análisis Sintáctico"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f0f0f0" },
  container: { padding: 12, gap: 10 },

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

  modeRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginBottom: 2,
  },
  modeBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bbb",
    paddingVertical: 6,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  modeBtnActive: {
    backgroundColor: "#4a4a4a",
    borderColor: "#4a4a4a",
  },
  modeBtnText: { fontSize: 13, color: "#555", fontFamily: FONT_UI },
  modeBtnTextActive: { color: "#fff", fontWeight: "600" },

  row: { flexDirection: "row", gap: 10 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d8d8d8",
    padding: 10,
    minHeight: 200,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  editorCardFix: {
    padding: 0,
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    fontFamily: FONT_UI,
    letterSpacing: 0.1,
  },
  cardTitleInternal: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    paddingTop: 10,
    paddingHorizontal: 10,
    marginBottom: 4,
    fontFamily: FONT_UI,
  },
  flex1: { flex: 1 },
  flex2: { flex: 2 },

  innerEditorScroll: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  innerEditorContent: {
    flexGrow: 1,
  },
  editorFlexRow: {
    flexDirection: "row",
    flex: 1,
    minHeight: 155,
  },

  gutterContainer: {
    width: 32,
    backgroundColor: "#f0f0f0",
    borderRightWidth: 1,
    borderColor: "#e0e0e0",
    paddingTop: EDITOR_PADDING,
    alignItems: "flex-end",
    paddingRight: 6,
  },
  gutterText: {
    fontFamily: FONT_MONO,
    fontSize: EDITOR_FONT_SIZE,
    lineHeight: EDITOR_LINE_HEIGHT,
    color: "#a0a0a0",
    textAlign: "right",
    includeFontPadding: false,
  },
  gutterTextError: {
    color: "#e53e3e",
    fontWeight: "bold",
  },

  textareaWorkspace: {
    flex: 1,
    position: "relative",
  },

  tokenUnderline: {
    position: "absolute",
    height: 2,
    backgroundColor: "#e53e3e",
    borderRadius: 1,
  },

  codeInput: {
    // Fija el input perfectamente a las 4 esquinas de 'textareaWorkspace'
    ...StyleSheet.absoluteFillObject,
    // Elimina scrollbars redundantes u ocultas del textarea nativo
    overflow: "hidden",
    fontFamily: FONT_MONO,
    fontSize: EDITOR_FONT_SIZE,
    lineHeight: EDITOR_LINE_HEIGHT,
    paddingTop: EDITOR_PADDING,
    paddingBottom: EDITOR_PADDING,
    paddingHorizontal: EDITOR_PADDING,
    color: "#1a1a1a",
    backgroundColor: "transparent",
    includeFontPadding: false,
  },

  errorScroll: { flex: 1 },
  errorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    gap: 4,
  },
  errorDot: { color: "#e53e3e", fontSize: 10, marginTop: 2 },
  errorText: { fontFamily: FONT_MONO, fontSize: 12, color: "#c53030", flex: 1 },
  emptyText: {
    fontSize: 12,
    color: "#aaa",
    fontStyle: "italic",
    fontFamily: FONT_UI,
    textAlign: "center",
    marginTop: 16,
  },

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
  tableScroll: { flex: 1, maxHeight: 200 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tableRowEven: { backgroundColor: "#f9f9f9" },
  tableRowFun: { backgroundColor: "#eef4ff" },
  tableCell: {
    fontSize: 12,
    color: "#222",
    padding: 5,
    fontFamily: FONT_UI,
    borderRightWidth: 1,
    borderRightColor: "#eee",
  },
  codeFontCell: { fontFamily: FONT_MONO, fontSize: 12, color: "#2b4f8e" },
  tagCell: { color: "#6b4c00", fontWeight: "500" },
  catVar: { color: "#276227", fontWeight: "500" },
  catFun: { color: "#1a4d8f", fontWeight: "500" },
  dash: { color: "#aaa" },
  center: { textAlign: "center" },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
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
  buttonDisabled: { backgroundColor: "#999" },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: FONT_UI,
    letterSpacing: 0.2,
  },
});
