import { render } from "preact";
import { App } from "./app.tsx";
import "./app.css";

const root = document.getElementById("app");
if (!root) throw new Error("アプリの起点が見つかりません。");
render(<App />, root);
