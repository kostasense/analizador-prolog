import { prologEngine } from "../src/prolog/PrologEngine";

const query = (goal: string) => prologEngine.queryAll(goal, false);
const queryAll = (goal: string) => prologEngine.queryAll(goal, true);
const prove = (goal: string) => prologEngine.prove(goal);
const assert = (fact: string) => prologEngine.assert(fact);
const retract = (fact: string) => prologEngine.retract(fact);

export class PrologService {
  async getTokensResults(code: string) {
    const safe = code
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      //.replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");

    console.log(safe);

    const result = await query(
      `tokenize('${safe}', Tokens), token(Tokens, Clasificados).`,
    );

    console.log(result);

    return result;
  }
}
