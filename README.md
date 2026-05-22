# Vibe Coding Prompt Mixer

Codex Meetup向けのvibeコーディングお題ジェネレーターです。

## ファイル構成

- `index.html`, `styles.css`, `app.js`: GitHub Pagesに置く画面
- `api/generate.js`: Vercelなどに置くOpenRouter呼び出しAPI
- `config.js`: GitHub Pages側から呼ぶAPI URL
- `.env.example`: Vercel環境変数の例

## OpenRouter APIキー

APIキーはブラウザ側に書かないでください。
VercelのEnvironment Variablesに次を設定します。

```text
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.5-flash
PUBLIC_SITE_URL=https://iishiken.github.io/codex-meetup-prompt-mixer
```

GitHub PagesからVercel APIを呼ぶ場合は、`config.js` にVercelのURLを入れます。

```js
window.PROMPT_MIXER_API_URL = "https://codex-meetup-prompt-mixer.vercel.app/api/generate";
```

Vercelに画面もAPIもまとめて置く場合は、`config.js` は空のままで動きます。

## 公開URL

GitHub Pages:

```text
https://iishiken.github.io/codex-meetup-prompt-mixer/
```

Vercel API:

```text
https://codex-meetup-prompt-mixer.vercel.app/api/generate
```
