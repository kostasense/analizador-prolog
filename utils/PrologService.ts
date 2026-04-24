import { prologEngine } from "../src/prolog/PrologEngine";

const query = (goal: string) => prologEngine.queryAll(goal, false);
const queryAll = (goal: string) => prologEngine.queryAll(goal, true);
const prove = (goal: string) => prologEngine.prove(goal);
const assert = (fact: string) => prologEngine.assert(fact);
const retract = (fact: string) => prologEngine.retract(fact);

export class PrologService {
  async tokenize(code: string) {
    const safe = code
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");

    const result = await query(`tokenize('${safe}', Tokens).`);

    console.log(result);
  }
}
