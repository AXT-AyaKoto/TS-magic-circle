import {
    shouldInterruptAfterDeadline,
    type QuickJSContext,
    type QuickJSHandle,
    type QuickJSWASMModule,
} from "quickjs-emscripten-core";
import { MEMORY_LIMIT_BYTES, RUN_DEADLINE_MS } from "./limits.ts";

export type GuestResult = { ok: boolean; output: string };

const TIMEOUT_TEXT = "Promise が時間内に完了しませんでした。";
const SHAPE_TEXT = "ファイル全体を、引数 input を受け取る矢印関数にしてください。";

export function runGuest(quickjs: QuickJSWASMModule, js: string, input: string): GuestResult {
    const runtime = quickjs.newRuntime();
    const context = runtime.newContext();
    const deadline = Date.now() + RUN_DEADLINE_MS;
    runtime.setMemoryLimit(MEMORY_LIMIT_BYTES);
    runtime.setInterruptHandler(shouldInterruptAfterDeadline(deadline));
    try {
        return evaluate(context, runtime, js, input, deadline);
    } catch (error) {
        return { ok: false, output: describeHostError(error) };
    } finally {
        try {
            context.dispose();
        } catch {
            // A leaked guest handle makes context disposal throw. The result is already copied out.
        }
        try {
            runtime.dispose();
        } catch {
            // Freeing a runtime that still has pending jobs aborts in QuickJS-NG. The next run uses a new runtime.
        }
    }
}

function evaluate(
    context: QuickJSContext,
    runtime: ReturnType<QuickJSWASMModule["newRuntime"]>,
    js: string,
    input: string,
    deadline: number,
): GuestResult {
    const evaluated = context.evalCode(js, "user.js", {
        type: "global",
        strict: true,
        backtraceBarrier: true,
    });
    if (evaluated.error) {
        const output = formatThrown(context.dump(evaluated.error));
        evaluated.dispose();
        return { ok: false, output };
    }
    const fn = evaluated.value;
    if (context.typeof(fn) !== "function") {
        fn.dispose();
        return { ok: false, output: SHAPE_TEXT };
    }
    const asyncFunction = isAsyncFunction(context, fn);
    const inputHandle = context.newString(input);
    const called = context.callFunction(fn, context.undefined, inputHandle);
    inputHandle.dispose();
    if (called.error) {
        const output = formatThrown(context.dump(called.error));
        called.dispose();
        fn.dispose();
        return { ok: false, output };
    }
    const returned = called.value;
    try {
        if (!asyncFunction) return { ok: true, output: renderHandle(context, returned) };
        return settle(context, runtime, returned, deadline);
    } finally {
        returned.dispose();
        fn.dispose();
    }
}

function isAsyncFunction(context: QuickJSContext, fn: QuickJSHandle): boolean {
    const ctor = context.getProp(fn, "constructor");
    const name = context.getProp(ctor, "name");
    try {
        return context.typeof(name) === "string" && context.getString(name) === "AsyncFunction";
    } finally {
        name.dispose();
        ctor.dispose();
    }
}

function settle(
    context: QuickJSContext,
    runtime: ReturnType<QuickJSWASMModule["newRuntime"]>,
    promise: QuickJSHandle,
    deadline: number,
): GuestResult {
    while (true) {
        const state = context.getPromiseState(promise);
        if (state.type === "fulfilled") {
            const output = renderHandle(context, state.value);
            if (!state.notAPromise) state.value.dispose();
            return { ok: true, output };
        }
        if (state.type === "rejected") {
            const output = formatThrown(context.dump(state.error));
            state.error.dispose();
            return { ok: false, output };
        }
        if (Date.now() >= deadline || !runtime.hasPendingJob()) {
            return { ok: false, output: TIMEOUT_TEXT };
        }
        const jobs = runtime.executePendingJobs();
        if (jobs.error) {
            const output = formatThrown(jobs.error.context.dump(jobs.error));
            jobs.dispose();
            return { ok: false, output };
        }
        jobs.dispose();
    }
}

function renderHandle(context: QuickJSContext, handle: QuickJSHandle): string {
    if (context.typeof(handle) === "string") return context.getString(handle);
    return formatValue(context.dump(handle.dup()));
}

function formatThrown(value: unknown): string {
    if (isInterrupt(value)) return TIMEOUT_TEXT;
    if (isGuestError(value)) {
        const stack = value.stack?.trim();
        const headline = `${value.name}: ${value.message}`;
        return stack ? `${headline}\n${stack}` : headline;
    }
    return formatValue(value);
}

function formatValue(value: unknown): string {
    if (typeof value === "string") return value;
    if (typeof value === "undefined") return "undefined";
    if (typeof value === "bigint") return `${value}n`;
    if (typeof value === "number" || typeof value === "boolean" || value === null) return String(value);
    try {
        return JSON.stringify(value, null, 2) ?? "undefined";
    } catch {
        return String(value);
    }
}

function isInterrupt(value: unknown): boolean {
    return isGuestError(value) && value.name === "InternalError" && value.message === "interrupted";
}

function isGuestError(value: unknown): value is { name: string; message: string; stack?: string } {
    if (typeof value !== "object" || value === null) return false;
    const record = value as Record<string, unknown>;
    return typeof record.name === "string" && typeof record.message === "string";
}

function describeHostError(error: unknown): string {
    if (error instanceof Error && error.message.includes("interrupted")) return TIMEOUT_TEXT;
    return error instanceof Error ? error.message : String(error);
}
