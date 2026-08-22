import { runAll } from "./pipeline_core.mjs";
console.log(JSON.stringify(await runAll(), null, 2));
