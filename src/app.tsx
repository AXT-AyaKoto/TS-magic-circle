import type { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { createEditors, type Editors } from "./editors.ts";
import {
    IconAlert,
    IconBraces,
    IconCheck,
    IconCopy,
    IconDot,
    IconGitHub,
    IconLink,
    IconOutput,
    IconPlay,
    IconSpinner,
    IconText,
    Mark,
} from "./icons.tsx";
import { execute, whenReady } from "./runner.ts";
import { readSession } from "./session.ts";

type Status =
    | { kind: "loading" | "ready" | "running" | "done" | "failed" }
    | { kind: "broken"; message: string };

const STATUS_LABEL = {
    loading: "読み込み中",
    ready: "準備完了",
    running: "実行中",
    done: "完了",
    failed: "失敗",
} as const;

const IS_APPLE = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
const SHORTCUT = IS_APPLE ? "⌘ ↵" : "Ctrl ↵";

export function App() {
    const inputHost = useRef<HTMLDivElement>(null);
    const outputHost = useRef<HTMLDivElement>(null);
    const codeHost = useRef<HTMLDivElement>(null);
    const editors = useRef<Editors | null>(null);
    const runRef = useRef<() => void>(() => {});
    const alive = useRef(true);
    const [status, setStatus] = useState<Status>({ kind: "loading" });
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
                setStatus((current) => (current.kind === "loading" ? { kind: "ready" } : current));
            })
            .catch((error: unknown) => {
                if (!alive.current) return;
                setStatus({
                    kind: "broken",
                    message:
                        error instanceof Error ? error.message : "実行環境を読み込めませんでした。",
                });
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
        setStatus({ kind: "running" });
        try {
            const result = await execute(current.code.getValue(), current.input.getValue());
            if (!alive.current) return;
            current.output.setValue(result.output);
            setStatus({ kind: result.ok ? "done" : "failed" });
        } catch (error) {
            if (!alive.current) return;
            current.output.setValue(error instanceof Error ? error.message : String(error));
            setStatus({ kind: "failed" });
        } finally {
            if (alive.current) setBusy(false);
        }
    }

    runRef.current = () => {
        void run();
    };

    function shareUrl(): string {
        const url = new URL(location.href);
        const current = editors.current;
        if (current) {
            url.searchParams.delete("t");
            url.searchParams.set("q", current.input.getValue());
            url.searchParams.set("p", current.code.getValue());
        }
        return url.href;
    }

    const working = status.kind === "loading" || status.kind === "running";

    return (
        <div class="page">
            <header class="masthead">
                <h1 class="brand">
                    <Mark class={working ? "mark is-working" : "mark"} />
                    TS Magic Circle
                </h1>
                <div class="actions">
                    <CopyButton
                        label="共有リンクをコピー"
                        doneLabel="共有リンクをコピーしました"
                        icon={<IconLink />}
                        getText={shareUrl}
                    />
                    <button
                        type="button"
                        class="run"
                        onClick={() => void run()}
                        disabled={!canRun || busy}
                        aria-keyshortcuts="Control+Enter Meta+Enter"
                    >
                        <IconPlay />
                        実行
                        <kbd aria-hidden="true">{SHORTCUT}</kbd>
                    </button>
                </div>
            </header>
            <main class="stage">
                <Pane id="input" label="入力" icon={<IconText />}>
                    <div class="editor" ref={inputHost} />
                </Pane>
                <Pane
                    id="output"
                    label="出力"
                    icon={<IconOutput />}
                    state={status.kind}
                    tools={
                        <>
                            <StatusBadge status={status} />
                            <CopyButton
                                label="出力をコピー"
                                doneLabel="出力をコピーしました"
                                icon={<IconCopy />}
                                getText={() => editors.current?.output.getValue() ?? ""}
                            />
                        </>
                    }
                >
                    <div class="editor" ref={outputHost} />
                </Pane>
                <Pane id="code" label="コード" icon={<IconBraces />}>
                    <div class="editor" ref={codeHost} />
                </Pane>
            </main>
            <footer class="colophon">
                <a class="with-icon" href="https://github.com/AXT-AyaKoto/TS-magic-circle">
                    <IconGitHub />
                    GitHub
                </a>
                <span class="credits">
                    <a href="https://github.com/quickjs-ng/quickjs">QuickJS-NG</a>
                    <a href="https://github.com/oxc-project/tsrs">tsrs</a>
                    <a href="https://microsoft.github.io/monaco-editor/">Monaco Editor</a>
                </span>
                <span class="copyright">copyright (c) 2026- Ayasaka-Koto.</span>
            </footer>
        </div>
    );
}

function Pane(props: {
    id: string;
    label: string;
    icon: ComponentChildren;
    state?: Status["kind"];
    tools?: ComponentChildren;
    children: ComponentChildren;
}) {
    const labelId = `${props.id}-label`;
    return (
        <section class={`pane pane-${props.id}`} aria-labelledby={labelId} data-state={props.state}>
            <div class="pane-head">
                <h2 id={labelId}>
                    {props.icon}
                    {props.label}
                </h2>
                {props.tools ? <div class="pane-tools">{props.tools}</div> : null}
            </div>
            {props.children}
        </section>
    );
}

function StatusBadge(props: { status: Status }) {
    const { status } = props;
    const text = status.kind === "broken" ? status.message : STATUS_LABEL[status.kind];
    const icon =
        status.kind === "loading" || status.kind === "running" ? (
            <IconSpinner />
        ) : status.kind === "done" ? (
            <IconCheck />
        ) : status.kind === "ready" ? (
            <IconDot />
        ) : (
            <IconAlert />
        );
    return (
        <p class="status" data-kind={status.kind} title={text} role="status">
            {icon}
            <span class="status-text">{text}</span>
        </p>
    );
}

function CopyButton(props: {
    label: string;
    doneLabel: string;
    icon: ComponentChildren;
    getText: () => string;
}) {
    const [state, setState] = useState<"idle" | "done" | "failed">("idle");
    const timer = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(timer.current), []);

    async function copy(): Promise<void> {
        try {
            await navigator.clipboard.writeText(props.getText());
            setState("done");
        } catch {
            setState("failed");
        }
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setState("idle"), 1600);
    }

    return (
        <>
            <button
                type="button"
                class="icon-button"
                data-state={state}
                aria-label={props.label}
                title={props.label}
                onClick={() => void copy()}
            >
                {state === "done" ? <IconCheck /> : state === "failed" ? <IconAlert /> : props.icon}
            </button>
            <span class="visually-hidden" role="status">
                {state === "done"
                    ? props.doneLabel
                    : state === "failed"
                      ? "コピーできませんでした"
                      : ""}
            </span>
        </>
    );
}
