/** Guest execution budget. An async function must settle inside this window. */
export const RUN_DEADLINE_MS = 2000;

/** QuickJS heap limit for one run. This is not the WebAssembly memory ceiling. */
export const MEMORY_LIMIT_BYTES = 128 * 1024 * 1024;
