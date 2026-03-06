import { startWorkers } from "./workers.js";

const runtime = startWorkers();

console.log("Workers started");

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await runtime.close();
    process.exit(0);
  });
}

