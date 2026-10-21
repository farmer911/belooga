/**
 * Belooga Mobile Metro / Bundle Dev Server (React Native 0.88.0 + Expo 58.0.16)
 * Serves:
 * - GET /status -> "packager-status:running" (React Native Metro status protocol)
 * - GET /index.android.bundle -> Compiled JS bundle from index.tsx
 * - GET / -> Interactive Mobile Preview shell
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

const PORT = Number(process.env.MOBILE_PORT || 8081);
const MOBILE_ROOT = join(import.meta.dir, "..");
const BUNDLE_PATH = join(
  MOBILE_ROOT,
  "android",
  "app",
  "src",
  "main",
  "assets",
  "index.android.bundle"
);

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/status") {
      return new Response("packager-status:running", {
        headers: { "Content-Type": "text/plain" },
      });
    }
    if (url.pathname === "/index.android.bundle" || url.pathname === "/index.bundle") {
      if (existsSync(BUNDLE_PATH)) {
        return new Response(readFileSync(BUNDLE_PATH), {
          headers: { "Content-Type": "application/javascript" },
        });
      }
      return new Response("// bundle pending build", {
        headers: { "Content-Type": "application/javascript" },
      });
    }
    return new Response(
      `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <title>Belooga Mobile (RN 0.88.0)</title>
  </head>
  <body style="margin:0;background:rgb(9, 13, 22);color:rgb(226, 232, 240);font-family:system-ui,sans-serif;">
    <div id="root"></div>
    <script type="module" src="/index.android.bundle"></script>
  </body>
</html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  },
});

console.log(`Belooga Mobile RN 0.88.0 Dev Server listening on http://localhost:${server.port}`);
