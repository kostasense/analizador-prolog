import { prologEngine } from "../src/prolog/PrologEngine";

const query = (goal: string) => prologEngine.queryAll(goal, false);
const queryAll = (goal: string) => prologEngine.queryAll(goal, true);
const prove = (goal: string) => prologEngine.prove(goal);
const assert = (fact: string) => prologEngine.assert(fact);
const retract = (fact: string) => prologEngine.retract(fact);

export class PrologService {}
