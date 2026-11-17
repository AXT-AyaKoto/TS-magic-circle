# TS Magic Circle

入力の文字列と TypeScript の矢印関数をブラウザの中で JavaScript に変換し、QuickJS の中で実行するサイトです。  
A site that transpiles a TypeScript arrow function in the browser and runs it inside QuickJS.

ユーザーのコードはページの JavaScript としては実行しません。QuickJS-NG の wasm の中だけで評価します。  
[JS magic circle](https://github.com/AyaExpTech/JS_magic-circle) の後継です。旧サイトとの互換は持っていません。

## License

copyright (c) 2026- Ayasaka-Koto (AyaExpTech).  
Released under the [MIT License](LICENSE).

## コードの書き方

コード欄には、ファイル全体が次の形になる矢印関数を書きます。引数 `input` が入力欄の文字列です。

```ts
(input: string): string => {
    return input.toUpperCase();
};
```

戻り値が文字列なら、その文字列が出力になります。文字列以外の値は、中身が分かる形に変換して表示します。型エラーがあるコードは実行しません。

一番外側の関数が `async` のときは、返った Promise が fulfilled か rejected になるまで実行を進め、中身を出力します。

```ts
async (input: string): Promise<string> => {
    const text = await Promise.resolve(input);
    return text.toUpperCase();
};
```

`import` や `export` は書けません。`document`、`fetch`、`setTimeout`、`console` はありません。`await new Promise(() => {})` のように完了しない Promise は、2秒で打ち切ります。QuickJS が使うメモリの上限は 128 MiB です。

変換は [tsrs](https://github.com/oxc-project/tsrs)（TypeScript 7.1.0-beta）の `target: "es2022"` です。実行は [QuickJS-NG](https://github.com/quickjs-ng/quickjs) v0.12.1（`quickjs-emscripten` 0.32.0）です。

## クエリ

ページを開いたときに、次のクエリを欄へ入れます。実行は「実行」ボタンか Ctrl+Enter / ⌘+Enter です。

| 名前    | 内容                                                    |
| ------- | ------------------------------------------------------- |
| `p`     | コード                                                  |
| `q`     | 入力。無いときは旧サイトの `t` を読みます               |
| `title` | タブのタイトルを `${title} \| TS Magic Circle` にします |

`file` は読みません。任意の URL を取得しないためです。

例: `/?q=ab&title=upper&p=(input%3A%20string)%3A%20string%20%3D%3E%20%7B%20return%20input.toUpperCase()%20%7D`

## 開発

[Vite+](https://viteplus.dev/) を使います。

```sh
vp dev
vp build
```

`vp dev` で開発サーバーが立ちます。`vp build` は静的ファイルを `dist/` に出します。型検査まで含めるときは `vp run build` です。

配信設定は [`wrangler.jsonc`](wrangler.jsonc) です。Cloudflare Workers の Static Assets だけで、Worker スクリプトは置きません。ビルド後の確認は次です。

```sh
vp exec wrangler dev
```

レスポンスヘッダは `public/_headers` にあります。`vp dev` はこのファイルを適用しません。
