import { useEffect, useRef, useState } from "preact/hooks";
import { createEditors, type Editors } from "./editors.ts";
import { execute, whenReady } from "./runner.ts";
import { readSession } from "./session.ts";

export function App() {
    const inputHost = useRef<HTMLDivElement>(null);
    const outputHost = useRef<HTMLDivElement>(null);
    const codeHost = useRef<HTMLDivElement>(null);
    const editors = useRef<Editors | null>(null);
    const runRef = useRef<() => void>(() => {});
    const alive = useRef(true);
    const [status, setStatus] = useState("実行環境を読み込んでいます");
    const [busy, setBusy] = useState(false);
    const [canRun, setCanRun] = useState(false);

    useEffect(() => {
        alive.current = true;
        const session = readSession(location.href);
        document.title = session.title;
        void whenReady()
            .then(() => {
                if (!alive.current) return;
                setCanRun(true);
                setStatus((current) =>
                    current === "実行環境を読み込んでいます" ? "準備完了" : current,
                );
            })
            .catch((error: unknown) => {
                if (!alive.current) return;
                setStatus(
                    error instanceof Error ? error.message : "実行環境を読み込めませんでした。",
                );
            });
        const input = inputHost.current;
        const output = outputHost.current;
        const code = codeHost.current;
        if (!input || !output || !code) return;
        const created = createEditors({
            input,
            output,
            code,
            session,
            onRun: () => {
                runRef.current();
            },
        });
        editors.current = created;
        return () => {
            alive.current = false;
            created.dispose();
            editors.current = null;
        };
    }, []);

    async function run(): Promise<void> {
        const current = editors.current;
        if (!current || busy) return;
        setBusy(true);
        setStatus("実行中");
        try {
            const result = await execute(current.code.getValue(), current.input.getValue());
            if (!alive.current) return;
            current.output.setValue(result.output);
            setStatus(result.ok ? "完了" : "失敗");
        } catch (error) {
            if (!alive.current) return;
            current.output.setValue(error instanceof Error ? error.message : String(error));
            setStatus("失敗");
        } finally {
            if (alive.current) setBusy(false);
        }
    }

    runRef.current = () => {
        void run();
    };

    return (
        <div class="page">
            <header class="masthead">
                <h1>TS Magic Circle</h1>
                <p>入力と TypeScript を JavaScript に変換し、QuickJS の中で実行します。</p>
            </header>
            <div class="toolbar">
                <button
                    type="button"
                    class="run"
                    onClick={() => void run()}
                    disabled={!canRun || busy}
                >
                    実行
                </button>
                <p class="status" aria-live="polite">
                    {status}
                    <span class="hint">Ctrl+Enter または ⌘+Enter</span>
                </p>
            </div>
            <div class="stage">
                <section class="pane pane-input" aria-labelledby="input-label">
                    <h2 id="input-label">入力</h2>
                    <div class="editor" ref={inputHost} />
                </section>
                <section class="pane pane-output" aria-labelledby="output-label">
                    <h2 id="output-label">出力</h2>
                    <div class="editor" ref={outputHost} />
                </section>
                <section class="pane pane-code" aria-labelledby="code-label">
                    <h2 id="code-label">コード</h2>
                    <div class="editor" ref={codeHost} />
                </section>
            </div>
            <footer>
                <a href="https://github.com/AXT-AyaKoto/TS-magic-circle">GitHub</a>
                <a href="https://github.com/AyaExpTech/JS_magic-circle">旧 JS magic circle</a>
                <span>© 2026 Ayasaka-Koto</span>
                <span>
                    実行は <a href="https://github.com/quickjs-ng/quickjs">QuickJS-NG</a>
                    、変換は <a href="https://github.com/oxc-project/tsrs">tsrs</a>
                    、編集は <a href="https://microsoft.github.io/monaco-editor/">Monaco Editor</a>
                </span>
            </footer>
        </div>
    );
}
