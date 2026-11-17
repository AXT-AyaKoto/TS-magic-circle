import { render } from "preact";
import { App } from "./app.tsx";
import "./app.css";

// Chrome / Firefox / Edge は <input switch> 未対応。対応ブラウザでは読み込まない。
// ポリフィル本体は CSS を fetch するが、Vite はその URL を JS モジュールにしてしまう。
// 見た目はこちらでスタイルシートとして読み込む。
if (!("switch" in HTMLInputElement.prototype)) {
    void import("input-switch-polyfill");
    void import("input-switch-polyfill/input-switch-polyfill.css");
}

const root = document.getElementById("app");
if (!root) throw new Error("アプリの起点が見つかりません。");
render(<App />, root);
