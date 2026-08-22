import { runPhase } from "./pipeline_core.mjs";
console.log(JSON.stringify(await runPhase("registry"), null, 2));
