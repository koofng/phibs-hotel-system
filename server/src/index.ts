import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { ensureBootstrapAdmin } from "./lib/bootstrap.js";

await ensureBootstrapAdmin();

const app = createApp();

app.listen(env.port, () => {
  console.log(`Server listening on http://localhost:${env.port}`);
});
