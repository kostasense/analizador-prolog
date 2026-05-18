import { prologEngine } from "../src/prolog/PrologEngine";

const query = (goal: string) => prologEngine.queryAll(goal, false);
const queryAll = (goal: string) => prologEngine.queryAll(goal, true);
const prove = (goal: string) => prologEngine.prove(goal);
const assert = (fact: string) => prologEngine.assert(fact);
const retract = (fact: string) => prologEngine.retract(fact);

export class PrologService {
  async getTokensResults(code: string) {
    const safe = this.escapeCode(code);
    console.log(safe);

    const result = await query(
      `tokenize('${safe}', Tokens), token(Tokens, Clasificados).`,
    );

    console.log(result);
    return result;
  }

  async analyzeCode(code: string): Promise<{
    lexemes: { lexema: string; componente: string }[];
    symbols: {
      nombre: string;
      categoria: string;
      tipo: string;
      valor: string;
      parametros: string;
      posicion: number;
    }[];
    errors: string[];
  }> {
    const safe = this.escapeCode(code);

    const lexResult = await query(
      `tokenize('${safe}', Tokens), token(Tokens, Clasificados).`,
    );

    const lexemes: { lexema: string; componente: string }[] = [];
    const lexErrors: string[] = [];

    if (lexResult && lexResult.length > 0) {
      for (const item of lexResult[0].Clasificados ?? []) {
        const tok = item.args[0];
        const typ = item.args[1];
        if (typ === "error") {
          lexErrors.push(`Token desconocido: ${tok}`);
        } else {
          lexemes.push({ lexema: String(tok), componente: String(typ) });
        }
      }
    }

    let symbols: {
      nombre: string;
      categoria: string;
      tipo: string;
      valor: string;
      parametros: string;
      posicion: number;
    }[] = [];
    let synErrors: string[] = [];

    try {
      const synResult = await query(`analizar('${safe}', Symbols, Errors).`);

      if (synResult && synResult.length > 0) {
        const rawSyms = synResult[0].Symbols ?? [];
        const rawErrs = synResult[0].Errors ?? [];

        // Parse sym/6 terms
        for (const sym of rawSyms) {
          if (sym && sym.args) {
            symbols.push({
              nombre: String(sym.args[0] ?? ""),
              categoria: String(sym.args[1] ?? ""),
              tipo: String(sym.args[2] ?? ""),
              valor: String(sym.args[3] ?? "-"),
              parametros: String(sym.args[4] ?? "-"),
              posicion: Number(sym.args[5] ?? 0),
            });
          }
        }

        // Errors are atoms
        for (const e of rawErrs) {
          synErrors.push(typeof e === "string" ? e : String(e));
        }
      }
    } catch (err) {
      synErrors.push("Error al ejecutar el analizador sintáctico.");
      console.error(err);
    }

    const errors = [...synErrors];

    if (synErrors.length > 0) {
      symbols = [];
    }

    return { lexemes, symbols, errors };
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
