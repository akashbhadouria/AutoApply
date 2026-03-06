import { createApp } from "./app.js";
import { env } from "./config.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});

