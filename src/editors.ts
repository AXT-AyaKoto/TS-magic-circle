import { KeyCode, KeyMod, editor, typescript } from "monaco-editor";
import editorWorker from "monaco-editor/editor/editor.worker.js?worker";
import tsWorker from "monaco-editor/language/typescript/ts.worker.js?worker";
import type { Session } from "./session.ts";

globalThis.MonacoEnvironment = {
    getWorker(_workerId: string, label: string) {
        if (label === "typescript" || label === "javascript") return new tsWorker();
        return new editorWorker();
    },
};

export type Editors = {
    input: editor.ICodeEditor;
    output: editor.ICodeEditor;
    code: editor.ICodeEditor;
    dispose: () => void;
};

const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    automaticLayout: true,
    minimap: { enabled: false },
    fontFamily: '"M PLUS 1 Code", ui-monospace, monospace',
    fontSize: 15,
    scrollBeyondLastLine: false,
    wordWrap: "on",
    tabSize: 2,
    padding: { top: 8, bottom: 8 },
    fixedOverflowWidgets: true,
    // shadow DOM だとメニューの --vscode-menu-background が届かず、背景が透明になる。
    useShadowDOM: false,
};

let typescriptConfigured = false;

export function createEditors(hosts: {
    input: HTMLElement;
    output: HTMLElement;
    code: HTMLElement;
    session: Session;
    onRun: () => void;
}): Editors {
    configureTypescript();
    const input = editor.create(hosts.input, {
        ...editorOptions,
        value: hosts.session.input,
        language: "plaintext",
    });
    const output = editor.create(hosts.output, {
        ...editorOptions,
        value: "",
        language: "plaintext",
        readOnly: true,
        domReadOnly: true,
    });
    const code = editor.create(hosts.code, {
        ...editorOptions,
        value: hosts.session.code,
        language: "typescript",
    });
    const command = KeyMod.CtrlCmd | KeyCode.Enter;
    for (const instance of [input, output, code]) {
        instance.addCommand(command, hosts.onRun);
    }
    return {
        input,
        output,
        code,
        dispose() {
            input.dispose();
            output.dispose();
            code.dispose();
        },
    };
}

function configureTypescript(): void {
    if (typescriptConfigured) return;
    typescriptConfigured = true;
    const defaults = typescript.typescriptDefaults;
    // 初期値の allowNonTsExtensions を残す。消すと inmemory モデルを診断できない。
    defaults.setCompilerOptions({
        ...defaults.getCompilerOptions(),
        strict: true,
        target: typescript.ScriptTarget.ESNext,
        module: typescript.ModuleKind.ESNext,
        lib: ["es2022"],
        noEmit: true,
    });
}
