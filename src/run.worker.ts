import variant from "@jitl/quickjs-ng-wasmfile-release-sync";
import quickjsWasmUrl from "@jitl/quickjs-ng-wasmfile-release-sync/wasm?url";
import { loadModule, tsc, type Diagnostic, type WasmModule } from "@tsrs/wasm";
import { newQuickJSWASMModuleFromVariant, newVariant, type QuickJSWASMModule } from "quickjs-emscripten-core";
import tsrsWasmUrl from "@tsrs/wasm/tsrs.wasm?url";
import { runGuest } from "./execute.ts";
import type { RunRequest, WorkerMessage } from "./protocol.ts";

const tsconfig = {
    compilerOptions: {
        strict: true,
        target: "es2022",
        module: "esnext",
        moduleResolution: "bundler",
        lib: ["es2022"],
        rootDir: "src",
        outDir: "out",
        noEmitOnError: true,
    },
    files: ["src/main.ts"],
};

let quickjs: QuickJSWASMModule | undefined;
let tsrsModule: WasmModule | undefined;

self.onmessage = (event: MessageEvent<RunRequest>) => {
    if (event.data.type !== "run") return;
    void handle(event.data);
};

void boot();

async function boot(): Promise<void> {
    try {
        quickjs = await newQuickJSWASMModuleFromVariant(newVariant(variant, { wasmLocation: quickjsWasmUrl }));
        tsrsModule = await Promise.resolve(loadModule(tsrsWasmUrl));
        post({ type: "ready" });
    } catch (error) {
        post({
            type: "failed",
            message: error instanceof Error ? error.message : String(error),
        });
    }
}

async function handle(request: RunRequest): Promise<void> {
    if (!quickjs || !tsrsModule) {
        post({ type: "result", id: request.id, ok: false, output: "実行環境の準備が終わっていません。" });
        return;
    }
    try {
        const compiled = await tsc(["-p", "/tsconfig.json", "--pretty", "false"], {
            cwd: "/",
            files: {
                "/tsconfig.json": JSON.stringify(tsconfig),
                "/src/main.ts": request.source,
            },
            diagnostics: "json",
            module: tsrsModule,
        });
        if (compiled.exitCode !== 0) {
            post({ type: "result", id: request.id, ok: false, output: compileFailure(compiled) });
            return;
        }
        const js = javascriptFrom(compiled.files);
        if (!js) {
            post({ type: "result", id: request.id, ok: false, output: "JavaScript が出力されませんでした。" });
            return;
        }
        const result = runGuest(quickjs, js, request.input);
        post({ type: "result", id: request.id, ...result });
    } catch (error) {
        post({
            type: "result",
            id: request.id,
            ok: false,
            output: error instanceof Error ? error.message : String(error),
        });
    }
}

function javascriptFrom(files: Record<string, string> | undefined): string | undefined {
    if (!files) return undefined;
    return files["/out/main.js"] ?? Object.entries(files).find(([path]) => path.endsWith(".js"))?.[1];
}

function compileFailure(result: { exitCode: number; stderr: string; diagnostics?: Diagnostic[] }): string {
    const diagnostics = formatDiagnostics(result.diagnostics ?? []);
    if (diagnostics) return diagnostics;
    const stderr = result.stderr.trim();
    if (stderr) return stderr;
    return `変換に失敗しました。終了コードは ${result.exitCode} です。`;
}

function formatDiagnostics(diagnostics: Diagnostic[]): string {
    return diagnostics
        .map((diagnostic) => {
            const line = diagnostic.startPosition ? diagnostic.startPosition.line + 1 : undefined;
            const column = diagnostic.startPosition ? diagnostic.startPosition.character + 1 : undefined;
            const where = line !== undefined && column !== undefined ? `${line}:${column} ` : "";
            const kind = diagnostic.category === 0 ? "警告" : "エラー";
            return `${where}${kind} TS${diagnostic.code}: ${diagnostic.text}`;
        })
        .join("\n");
}

function post(message: WorkerMessage): void {
    self.postMessage(message);
}
