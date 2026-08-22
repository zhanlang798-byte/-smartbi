import { runPhase } from "./pipeline_core.mjs";
console.log(JSON.stringify(await runPhase("handoff"), null, 2));
