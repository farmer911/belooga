import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterEach } from "bun:test";

GlobalRegistrator.register({ url: "http://localhost:3000/" });

// Tell React 19 that act() is available so state updates are flushed in tests.
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

// Imported after the DOM exists: @testing-library/dom captures `document` on load.
const { cleanup } = await import("@testing-library/react");
afterEach(cleanup);
