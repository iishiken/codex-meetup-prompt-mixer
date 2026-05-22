const form = document.querySelector("#prompt-form");
const themeSelect = document.querySelector("#theme");
const difficultySelect = document.querySelector("#difficulty");
const stackSelect = document.querySelector("#stack");
const toneSelect = document.querySelector("#tone");
const challengeOutput = document.querySelector("#challenge-output");
const difficultyOutput = document.querySelector("#difficulty-output");
const durationOutput = document.querySelector("#duration-output");
const promptOutput = document.querySelector("#prompt-output");
const promptTag = document.querySelector("#prompt-tag");
const promptTime = document.querySelector("#prompt-time");
const generateButton = document.querySelector("#generate-button");
const copyButton = document.querySelector("#copy-button");
const remixButton = document.querySelector("#remix-button");
const historyList = document.querySelector("#history-list");
const toast = document.querySelector("#toast");

const API_ENDPOINT = window.PROMPT_MIXER_API_URL || "";

const themes = {
  meetup: [
    "Codex Meetupの参加者が、今日試したいAI活用アイデアを投稿して一覧できるミニアプリ",
    "ライブ中に出た質問を記録し、未回答と回答済みで切り替えられるQ&Aボード",
    "懇親会で使えるトークテーマをランダム表示し、気に入ったものを保存できるページ",
  ],
  personal: [
    "自分のGitHub Pagesに置ける、登壇予定と作ったものを並べたプロフィールページ",
    "最近学んだことをカード形式で残せる、軽いポートフォリオ兼メモアプリ",
    "SNSリンク、登壇資料、デモURLを1画面にまとめたイベント用リンクハブ",
  ],
  learning: [
    "今日覚えたコマンドを入力すると、用途別に整理してくれるチートシート",
    "AIへの指示文を改善する練習ができる、Before/After比較ツール",
    "短い学習ログを入力すると、次に試す小さな課題を提案するアプリ",
  ],
  playful: [
    "ライブコーディングのお題をルーレット風に決めるミニアプリ",
    "会場の空気に合わせて、デモ用アプリ名をランダム生成するネーミングマシン",
    "制限時間と縛り条件を組み合わせて、即興開発チャレンジを作るゲーム",
  ],
  data: [
    "参加者アンケートの仮データを棒グラフで表示し、フィルタで切り替えられるダッシュボード",
    "GitHub活動のサンプルデータを使って、今週の開発リズムを可視化するページ",
    "イベントのタイムテーブルを入力すると、カテゴリ別の時間配分を表示するツール",
  ],
};

const difficultyDetails = {
  easy: "5分で最初の画面が見えるくらい小さく作って",
  medium: "10分で基本機能まで作り、追加指示で育てられる構成にして",
  hard: "まず動くMVPを作り、あとから機能追加しやすい状態にして",
};

const stackDetails = {
  static: "HTML/CSS/JavaScriptだけで、GitHub Pagesにそのまま置けるようにして",
  react: "Reactで、コンポーネントを分けすぎず読みやすく作って",
  next: "Next.jsで、最初のページからすぐ触れるアプリとして作って",
  api: "外部APIかサンプルJSONを使い、通信失敗時の表示も用意して",
};

const toneDetails = {
  clean: "見た目は明るく実用的で、スマホでも操作しやすくして",
  editorial: "イベント感のある編集的なデザインで、最初の画面に見せ場を作って",
  minimal: "ミニマルで情報が読みやすいデザインにして",
  neon: "デモ映えする配色にしつつ、文字の読みやすさは保って",
};

const labels = {
  meetup: "Meetup支援",
  personal: "個人ページ",
  learning: "学習ツール",
  playful: "遊べるミニアプリ",
  data: "データ可視化",
  easy: "5分で見える",
  medium: "10分で育つ",
  hard: "改善余地あり",
};

const history = [];
let lastIndexes = {};

function pickPrompt(theme, forceNext = false) {
  const options = themes[theme];
  const currentIndex = lastIndexes[theme] ?? -1;
  let nextIndex = Math.floor(Math.random() * options.length);

  if (forceNext && options.length > 1) {
    nextIndex = (currentIndex + 1) % options.length;
  }

  lastIndexes = { ...lastIndexes, [theme]: nextIndex };
  return options[nextIndex];
}

function buildLocalPrompt(forceNext = false) {
  const theme = themeSelect.value;
  const difficulty = difficultySelect.value;
  const stack = stackSelect.value;
  const tone = toneSelect.value;
  const idea = pickPrompt(theme, forceNext);
  const duration = difficulty === "easy" ? "5分" : difficulty === "medium" ? "10分" : "15分";

  const prompt = [
    `${idea}を作ってください。`,
    difficultyDetails[difficulty],
    stackDetails[stack],
    toneDetails[tone],
    "最初の画面から実際に使える状態にし、必要なら起動方法も教えてください。",
  ].join("\n");

  renderResult({
    challenge: idea,
    difficulty: labels[difficulty],
    duration,
    prompt,
  });
}

function getCurrentConditions() {
  return {
    theme: labels[themeSelect.value],
    difficulty: labels[difficultySelect.value],
    stack: stackSelect.options[stackSelect.selectedIndex].textContent,
    tone: toneSelect.options[toneSelect.selectedIndex].textContent,
  };
}

async function buildPrompt(forceNext = false) {
  if (!API_ENDPOINT) {
    buildLocalPrompt(forceNext);
    showToast("API URL未設定のためサンプル生成です");
    return;
  }

  generateButton.disabled = true;
  remixButton.disabled = true;
  generateButton.textContent = "生成中";

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...getCurrentConditions(),
        remix: forceNext,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "AI生成に失敗しました");
    }

    renderResult(data);
    showToast("生成しました");
  } catch (error) {
    buildLocalPrompt(forceNext);
    showToast(`${error.message}。サンプルを表示しました`);
  } finally {
    generateButton.disabled = false;
    remixButton.disabled = false;
    generateButton.textContent = "生成する";
  }
}

function renderResult(result) {
  const challenge = result.challenge || result.title || "ライブコーディングお題";
  const difficulty = result.difficulty || labels[difficultySelect.value];
  const duration = result.duration || result.time || "10分";
  const prompt = result.prompt || result.text || challenge;

  promptTag.textContent = labels[themeSelect.value];
  promptTime.textContent = duration;
  challengeOutput.textContent = challenge;
  difficultyOutput.textContent = difficulty;
  durationOutput.textContent = duration;
  promptOutput.textContent = prompt;
  addHistory(`${challenge} / ${difficulty} / ${duration}`);
}

function addHistory(prompt) {
  history.unshift(prompt);
  history.splice(5);
  historyList.innerHTML = "";

  history.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item.split("\n")[0];
    historyList.append(listItem);
  });
}

async function copyPrompt() {
  const text = [
    `お題: ${challengeOutput.textContent.trim()}`,
    `難易度: ${difficultyOutput.textContent.trim()}`,
    `時間: ${durationOutput.textContent.trim()}`,
    "",
    promptOutput.textContent.trim(),
  ].join("\n");

  try {
    await navigator.clipboard.writeText(text);
    showToast("コピーしました");
  } catch {
    showToast("コピーできませんでした");
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1800);
}

generateButton.addEventListener("click", () => buildPrompt());
remixButton.addEventListener("click", () => buildPrompt(true));
copyButton.addEventListener("click", copyPrompt);
form.addEventListener("change", () => buildLocalPrompt());

buildPrompt();
