import type { RunRequest, WorkerMessage } from "./protocol.ts";

export type RunResult = { ok: boolean; output: string };

type Pending = {
    resolve: (result: RunResult) => void;
    reject: (error: Error) => void;
};

let worker: Worker | undefined;
let ready: Promise<void> | undefined;
let nextId = 0;
const pending = new Map<number, Pending>();

export function whenReady(): Promise<void> {
    return ensure().ready;
}

export async function execute(source: string, input: string): Promise<RunResult> {
    const current = ensure();
    await current.ready;
    const id = ++nextId;
    const gate = Promise.withResolvers<RunResult>();
    pending.set(id, gate);
    const request: RunRequest = { type: "run", id, source, input };
    current.worker.postMessage(request);
    return gate.promise;
}

function ensure(): { worker: Worker; ready: Promise<void> } {
    if (worker && ready) return { worker, ready };
    const next = new Worker(new URL("./run.worker.ts", import.meta.url), { type: "module" });
    const gate = Promise.withResolvers<void>();
    next.addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
        const message = event.data;
        if (message.type === "ready") {
            gate.resolve();
            return;
        }
        if (message.type === "failed") {
            gate.reject(new Error(message.message));
            rejectPending(new Error(message.message));
            drop(next);
            return;
        }
        const waiting = pending.get(message.id);
        if (!waiting) return;
        pending.delete(message.id);
        waiting.resolve({ ok: message.ok, output: message.output });
    });
    next.addEventListener("error", () => {
        const error = new Error("実行環境を読み込めませんでした。");
        gate.reject(error);
        rejectPending(error);
        drop(next);
    });
    worker = next;
    ready = gate.promise;
    return { worker: next, ready: gate.promise };
}

function rejectPending(error: Error): void {
    for (const [id, waiting] of pending) {
        pending.delete(id);
        waiting.reject(error);
    }
}

function drop(target: Worker): void {
    if (worker !== target) return;
    worker = undefined;
    ready = undefined;
}
