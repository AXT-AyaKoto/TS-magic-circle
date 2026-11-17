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
    fontSize: 14,
    lineHeight: 22,
    scrollBeyondLastLine: false,
    wordWrap: "on",
    tabSize: 2,
    padding: { top: 12, bottom: 12 },
    glyphMargin: false,
    folding: false,
    lineNumbersMinChars: 3,
    renderLineHighlightOnlyWhenFocus: true,
    overviewRulerLanes: 0,
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    scrollbar: { useShadows: false, verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
    fixedOverflowWidgets: true,
    // shadow DOM だとメニューの --vscode-menu-background が届かず、背景が透明になる。
    useShadowDOM: false,
};

const LIGHT_THEME = "magic-circle-light";
const DARK_THEME = "magic-circle-dark";

// Monaco のテーマは #RRGGBB(AA) しか受け付けない。値は app.css の oklch トークンを sRGB にしたもの。
const themeColors = {
    [LIGHT_THEME]: {
        surface: "#fdfdfe",
        text: "#22232e",
        muted: "#676875",
        faint: "#a3a4ad",
        highlight: "#f4f5fb",
        selection: "#d4d8fc",
        accent: "#5748cf",
    },
    [DARK_THEME]: {
        surface: "#181920",
        text: "#e7e7ed",
        muted: "#a2a3b0",
        faint: "#61626c",
        highlight: "#1f2028",
        selection: "#393969",
        accent: "#9da0fb",
    },
};

let typescriptConfigured = false;
let themesDefined = false;

export function createEditors(hosts: {
    input: HTMLElement;
    output: HTMLElement;
    code: HTMLElement;
    session: Session;
    onRun: () => void;
}): Editors {
    configureTypescript();
    defineThemes();
    const darkScheme = matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
        editor.setTheme(darkScheme.matches ? DARK_THEME : LIGHT_THEME);
    };
    applyTheme();
    darkScheme.addEventListener("change", applyTheme);
    const input = editor.create(hosts.input, {
        ...editorOptions,
        value: hosts.session.input,
        language: "plaintext",
        placeholder: "関数に渡す文字列",
    });
    const output = editor.create(hosts.output, {
        ...editorOptions,
        value: "",
        language: "plaintext",
        readOnly: true,
        domReadOnly: true,
        renderLineHighlight: "none",
        placeholder: "実行すると結果が表示されます",
    });
    const code = editor.create(hosts.code, {
        ...editorOptions,
        value: hosts.session.code,
        language: "typescript",
        folding: true,
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
            darkScheme.removeEventListener("change", applyTheme);
            input.dispose();
            output.dispose();
            code.dispose();
        },
    };
}

function defineThemes(): void {
    if (themesDefined) return;
    themesDefined = true;
    for (const [name, c] of Object.entries(themeColors)) {
        editor.defineTheme(name, {
            base: name === DARK_THEME ? "vs-dark" : "vs",
            inherit: true,
            rules: [],
            colors: {
                "editor.background": c.surface,
                "editor.foreground": c.text,
                "editorGutter.background": c.surface,
                "editorLineNumber.foreground": c.faint,
                "editorLineNumber.activeForeground": c.muted,
                "editor.lineHighlightBackground": c.highlight,
                "editor.lineHighlightBorder": c.highlight,
                "editor.selectionBackground": c.selection,
                "editor.inactiveSelectionBackground": `${c.selection}99`,
                "editorCursor.foreground": c.accent,
                "editor.placeholder.foreground": c.muted,
                "scrollbar.shadow": "#00000000",
            },
        });
    }
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
