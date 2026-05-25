import { prologEngine } from "../src/prolog/PrologEngine";

export interface Lexeme {
  lexema: string;
  componente: string;
}

export interface SymbolRow {
  nombre: string;
  categoria: string;
  tipo: string;
  valor: string;
  parametros: string;
  posicion: number;
}

export interface AnalysisResult {
  lexemes: Lexeme[];
  symbols: SymbolRow[];
  errors: string[];
}

const query = (goal: string) => prologEngine.queryAll(goal, false);

export class PrologService {
  private unwrap(term: any): string {
    if (term === null || term === undefined) return "";

    if (typeof term === "string") return term;
    if (typeof term === "number") return String(term);

    if (
      term.functor === "-" &&
      Array.isArray(term.args) &&
      term.args.length === 2
    ) {
      const arg1 = term.args[0];
      const arg2 = term.args[1];

      const val1 = this.unwrap(arg1);
      const val2 = this.unwrap(arg2);

      if (typeof arg1 === "string" && typeof arg2 === "number") return val1;
      if (typeof arg2 === "string" && typeof arg1 === "number") return val2;

      if (typeof arg1 === "number" && typeof arg2 === "number") return val2;

      return val2 || val1;
    }

    if (term.id !== undefined) return String(term.id);
    if (term.value !== undefined) return String(term.value);

    return String(term);
  }

  // ─── ANÁLISIS LÉXICO ─────────────────────────────────────────────────────
  async getLexicalAnalysis(code: string): Promise<AnalysisResult> {
    const safe = this.escapeCode(code);
    const result = await query(
      `tokenize('${safe}', Tokens), token(Tokens, Clasificados).`,
    );

    console.log(result);

    const lexemes: Lexeme[] = [];
    const symbols: SymbolRow[] = [];
    const errors: string[] = [];

    if (result && result.length > 0) {
      let pos = 0;
      for (const item of result[0].Clasificados ?? []) {
        if (item && item.args && item.args.length === 2) {
          // item.args[0] es el objeto compuesto del Token
          // item.args[1] es el string del tipo ("palabra reservada", "identificador", etc.)
          const token = this.unwrap(item.args[0]);
          const type = this.unwrap(item.args[1]);

          if (type === "error") {
            errors.push(`Token desconocido: ${token}`);
          } else {
            lexemes.push({ lexema: token, componente: type });

            if (type === "identificador") {
              symbols.push({
                nombre: token,
                categoria: "variable",
                tipo: "",
                valor: "-",
                parametros: "-",
                posicion: pos++,
              });
            }
          }
        }
      }
    }

    return { lexemes, symbols, errors };
  }

  // ─── ANÁLISIS COMPLETO (LÉXICO + SINTÁCTICO) ─────────────────────────────
  async getFullAnalysis(code: string): Promise<AnalysisResult> {
    const safe = this.escapeCode(code);

    const { lexemes, errors: lexErrors } = await this.getLexicalAnalysis(code);

    let symbols: SymbolRow[] = [];
    let synErrors: string[] = [];

    try {
      const synResult = await query(`analizar('${safe}', Symbols, Errors).`);

      if (synResult && synResult.length > 0) {
        const rawSyms = synResult[0].Symbols ?? [];
        const rawErrs = synResult[0].Errors ?? [];

        for (const sym of rawSyms) {
          if (sym && sym.args) {
            symbols.push({
              nombre: this.unwrap(sym.args[0]),
              categoria: this.unwrap(sym.args[1]),
              tipo: this.unwrap(sym.args[2]),
              valor: this.unwrap(sym.args[3]) || "-",
              parametros: this.unwrap(sym.args[4]) || "-",
              posicion: Number(this.unwrap(sym.args[5]) ?? 0),
            });
          }
        }

        for (const e of rawErrs) {
          synErrors.push(this.unwrap(e));
        }
      }
    } catch (err) {
      synErrors.push("Error crítico al ejecutar el analizador sintáctico.");
      console.error(err);
    }

    const allErrors = [...lexErrors, ...synErrors];

    return {
      symbols: synErrors.length > 0 ? [] : symbols,
      lexemes,
      errors: allErrors,
    };
  }

  private escapeCode(code: string): string {
    return code
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
  }
}
