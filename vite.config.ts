import preact from "@preact/preset-vite";
import { defineConfig, lazyPlugins } from "vite-plus";

// https://vite.dev/config/
export default defineConfig({
    worker: { format: "es" },
    optimizeDeps: {
        exclude: ["@tsrs/wasm", "@jitl/quickjs-ng-wasmfile-release-sync", "quickjs-emscripten-core"],
    },
    fmt: {},
    lint: {
        jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
        rules: { "vite-plus/prefer-vite-plus-imports": "error" },
        options: { typeAware: true, typeCheck: true },
    },
    plugins: lazyPlugins(() => [preact()]),
});
