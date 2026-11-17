# AXT-AyaKoto/TS-magic-circle

TypeScriptコードを簡単に実行できるサイトです。
文字列入出力ができるので文字列変換処理を適当にやりたいときに使ってください。
ある程度安全なのでプログラム書ける人にコードだけ書かせるのもありだとおもいます。

## License

copyright (c) 2026- Ayasaka-Koto (AyaExpTech).  
Released under the [MIT License](LICENSE).

## 使い方

簡単にいうと……

1. [`ts-magic-circle.ayagawap.workers.dev`](https://ts-magic-circle.ayagawap.workers.dev/)を開きます
2. 「コード」欄に実行したいコードを書きます (コードの書き方は後述しますが、AIに書かせることもできます)
3. 「入力」欄に処理したいテキストを書きます
4. 「実行」ボタンを押します
    - Macでは`command` + `Enter`、Windowsなどでは`Ctrl` + `Enter`で実行することもできます
5. 「出力」欄に結果が出るので、煮るなり焼くなり好きにしてください

### コードを準備する

#### AIに書かせたい人向け

プロンプトの先頭に以下をコピペして、後ろにあなたの指示を続けてください。

````md
ユーザーは「TS-magic-circle」というWebアプリで使うのコードをあなたに書いてほしいと考えています。
TS-magic-circleは、TypeScriptコードと文字列の入力欄があり、実行ボタンを押すとTypeScriptコードを実行して出力を表示するサイトです。
TS-magic-circleが受け付けるコードは、`(input: string) => string`であるようなTypeScript関数です。
たとえば以下は、TS-magic-circleが受け付ける「入力文字列を大文字化して返すコード」です。関数末尾の`;`の有無は任意です。

```ts
(input: string): string => {
    return input.toUpperCase();
};
```

TS-magic-circleはasync funcitonも受け付けます。

```ts
async (input: string): Promise<string> => {
    return input.toUpperCase();
};
```

実行コンテキストはブラウザから分離されたQuickJS-NGのwasmビルドです。`document`, `fetch`, `setTimeout`, `console`などは使えません。`import`, `export`も無効です。
2秒の実行時間制限、(およそ)128MiBのメモリ制限があります。
以上を踏まえて、ユーザーの依頼に応えてください。

---
````

#### 自力でコードを書く場合

「コード」欄に書くコードは、TypeScript・JavaScriptの関数です。  
文字列を1つ引数として受け取り、文字列を返す関数を書いてください。終端の`;`はあってもなくてもよいです。

```ts
(input: string): string => {
    return input.toUpperCase();
};
```

```js
(input) => {
    return input.toUpperCase();
};
```

> [!NOTE]
> async functionも実行できます。返ったPromiseがfulfilledかrejectedになるまで実行が自動で進みます。
>
> ```ts
> (input: string): string => {
>     return input.toUpperCase();
> };
> ```

> [!IMPORTANT]
>
> - `import`, `export`は無効です
> - `document`, `fetch`, `setTimeout`, `console`などはありません (分かる人向けに述べると、中身はQuickJS-NGです)
> - 実行時間制限は2秒で、超えたら自動で打ち切ります
> - メモリ上限は128MiBと設定はしています(が、これは厳密な上限ではない可能性があります)

### URLで共有する

実行ボタンの隣に「共有リンクをコピー」ボタンがあります。  
これを押すと、現在の入力欄・コード欄の内容を含めた共有リンクをコピーできます。

> [!TIP]
> 以下はクエリパラメータを知っている人向けの情報です。知らない人は読み飛ばしてください。
> 
> - `p`でコード、`q`で入力文字列を指定できます
> - `title`を指定するとタブのタイトルに追加の文字列を指定できます
> - 各パラメータの処理は`URLSearchParams`で処理しています
>     - URLに含むことができない文字列はパーセントエンコードする必要があります
>     - これ自体の変換をTS Magic Circleでやることもできます → [開く](https://ts-magic-circle.ayagawap.workers.dev/?p=%28input%3A+string%29%3A+string+%3D%3E+%7B%0A++++return+encodeURIComponent%28input%29%0A++++++++.replaceAll%28%22%2520%22%2C+%22%2B%22%29%0A++++++++.replaceAll%28%22%21%22%2C+%22%2521%22%29%0A++++++++.replaceAll%28%22%27%22%2C+%22%2527%22%29%0A++++++++.replaceAll%28%22%28%22%2C+%22%2528%22%29%0A++++++++.replaceAll%28%22%29%22%2C+%22%2529%22%29%0A++++++++.replaceAll%28%22%7E%22%2C+%22%257E%22%29%3B%0A%7D%3B)

## 開発者向けの情報

[Vite+](https://viteplus.dev/)を使います。開発サーバーは`vp dev`、静的ビルドは`vp build`でどうぞ。

Contribution: バグ報告はIssuesで受け付けますが、その他のIssues・PRは受け付けません。こんなものよりもっとでかいものに貢献してください。
