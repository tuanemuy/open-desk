# デザイントークン

選定方向性: **Clean Neutral** — ミニマル・プロフェッショナル・余白重視

## カラー

### Primary（ブランドカラー）

| トークン | OKLCH | HEX | 用途 |
|---------|-------|-----|------|
| `--color-primary-lighter` | `oklch(0.95 0.03 250)` | #E8F0FB | 選択状態の背景、薄いハイライト |
| `--color-primary-light` | `oklch(0.82 0.07 250)` | #A8C8EB | ホバー背景、セカンダリアクセント |
| `--color-primary` | `oklch(0.65 0.12 250)` | #4A90D9 | リンク、アクティブ状態、プライマリアクション |
| `--color-primary-dark` | `oklch(0.52 0.12 250)` | #3170B8 | ホバー時のリンク、押下状態 |
| `--color-primary-darker` | `oklch(0.40 0.12 250)` | #1E5299 | 強調テキスト |

### Accent（アクセントカラー）

| トークン | OKLCH | HEX | 用途 |
|---------|-------|-----|------|
| `--color-accent` | `oklch(0.65 0.15 270)` | #5B6AE0 | CTA ボタン、重要な要素 |
| `--color-accent-light` | `oklch(0.90 0.05 270)` | #ECEEFB | アクセント背景 |

### Neutral（ニュートラルスケール）

| トークン | OKLCH | HEX | 用途 |
|---------|-------|-----|------|
| `--color-neutral-50` | `oklch(0.98 0.002 250)` | #F8F9FA | ページ背景 |
| `--color-neutral-100` | `oklch(0.96 0.004 250)` | #F3F4F6 | ホバー背景、セクション背景 |
| `--color-neutral-150` | `oklch(0.94 0.004 250)` | #ECEDEF | 交互行背景 |
| `--color-neutral-200` | `oklch(0.92 0.005 250)` | #E8EAED | ボーダー、セパレーター |
| `--color-neutral-300` | `oklch(0.86 0.008 250)` | #D1D5DB | 無効状態のボーダー |
| `--color-neutral-400` | `oklch(0.72 0.015 250)` | #9CA3AF | プレースホルダーテキスト |
| `--color-neutral-500` | `oklch(0.60 0.02 250)` | #6B7280 | セカンダリテキスト |
| `--color-neutral-600` | `oklch(0.50 0.02 250)` | #4B5563 | ラベルテキスト |
| `--color-neutral-700` | `oklch(0.40 0.02 250)` | #374151 | 見出しテキスト |
| `--color-neutral-800` | `oklch(0.30 0.02 250)` | #1F2937 | 本文テキスト |
| `--color-neutral-900` | `oklch(0.20 0.02 250)` | #111827 | 強調テキスト |

### Semantic（意味カラー）

| トークン | OKLCH | HEX | 用途 |
|---------|-------|-----|------|
| `--color-success` | `oklch(0.60 0.15 155)` | #16A34A | 成功、完了、アクティブ |
| `--color-success-light` | `oklch(0.95 0.04 155)` | #DCFCE7 | 成功背景 |
| `--color-warning` | `oklch(0.75 0.15 80)` | #D97706 | 警告、注意 |
| `--color-warning-light` | `oklch(0.95 0.05 80)` | #FEF3C7 | 警告背景 |
| `--color-error` | `oklch(0.60 0.20 25)` | #DC2626 | エラー、削除 |
| `--color-error-light` | `oklch(0.95 0.04 25)` | #FEE2E2 | エラー背景 |
| `--color-info` | `oklch(0.65 0.12 250)` | #4A90D9 | 情報（Primary と同じ） |
| `--color-info-light` | `oklch(0.95 0.03 250)` | #E8F0FB | 情報背景 |

### Background（背景）

| トークン | OKLCH | HEX | 用途 |
|---------|-------|-----|------|
| `--color-bg-page` | `oklch(0.98 0.002 250)` | #F8F9FA | ページ全体の背景 |
| `--color-bg-card` | `oklch(1.0 0 0)` | #FFFFFF | カード・パネルの背景 |
| `--color-bg-section` | `oklch(0.96 0.004 250)` | #F3F4F6 | セクション区切り背景 |
| `--color-bg-header` | `oklch(1.0 0 0)` | #FFFFFF | グローバルヘッダー背景 |

### Text on Colored Backgrounds（カラー背景上のテキスト）

| トークン | OKLCH | HEX | 用途 |
|---------|-------|-----|------|
| `--color-on-primary` | `oklch(1.0 0 0)` | #FFFFFF | Primary/Accent背景上のテキスト・アイコン |

## タイポグラフィ

### Font Family

| トークン | 値 | 用途 |
|---------|-----|------|
| `--font-heading` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | 見出し |
| `--font-body` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | 本文 |

※ 見出し・本文ともにInter。ウェイトで差をつける。

### Font Size Scale

| トークン | 値 | 用途 |
|---------|-----|------|
| `--text-xs` | `clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem)` | 補足テキスト、タイムスタンプ（11-12px） |
| `--text-sm` | `clamp(0.75rem, 0.7rem + 0.15vw, 0.8125rem)` | セカンダリラベル、メタ情報（12-13px） |
| `--text-base` | `clamp(0.8125rem, 0.78rem + 0.15vw, 0.875rem)` | 本文、テーブルセル（13-14px） |
| `--text-lg` | `clamp(0.9375rem, 0.9rem + 0.15vw, 1rem)` | セクション見出し、ウィジェットタイトル（15-16px） |
| `--text-xl` | `clamp(1.125rem, 1.05rem + 0.2vw, 1.25rem)` | ページサブ見出し（18-20px） |
| `--text-2xl` | `clamp(1.375rem, 1.25rem + 0.3vw, 1.5rem)` | ページ見出し（22-24px） |
| `--text-3xl` | `clamp(1.75rem, 1.6rem + 0.4vw, 2rem)` | ヒーロー見出し（28-32px） |

### Font Weight

| トークン | 値 | 用途 |
|---------|-----|------|
| `--weight-normal` | `400` | 本文テキスト |
| `--weight-medium` | `500` | ラベル、ナビゲーション、ボタンテキスト |
| `--weight-semibold` | `600` | セクション見出し、強調要素 |

※ 300（Light）、700以上（Bold）は使用しない。控えめで繊細な印象を維持する。

### Line Height

| トークン | 値 | 用途 |
|---------|-----|------|
| `--leading-tight` | `1.3` | 見出し |
| `--leading-normal` | `1.6` | 本文、リスト |
| `--leading-relaxed` | `1.8` | 長文コンテンツ |

### Letter Spacing

| トークン | 値 | 用途 |
|---------|-----|------|
| `--tracking-tight` | `-0.02em` | ロゴ、大きな見出し |
| `--tracking-normal` | `0` | 通常テキスト |

## スペーシング

Base Unit: **4px**

| トークン | 値 | 用途 |
|---------|-----|------|
| `--space-xs` | `4px` | アイコンとテキストの間隔 |
| `--space-sm` | `8px` | 関連要素間の最小間隔 |
| `--space-md` | `16px` | カード内パディング、リストアイテム間隔 |
| `--space-lg` | `24px` | セクション内の要素グループ間 |
| `--space-xl` | `32px` | ページ左右パディング、カード間のギャップ |
| `--space-2xl` | `48px` | セクション間のスペーシング |
| `--space-3xl` | `64px` | 大セクション間 |
| `--space-section` | `48px` | メインコンテンツのセクション間（`--space-2xl` と同値） |

## Border Radius

| トークン | 値 | 用途 |
|---------|-----|------|
| `--radius-sm` | `4px` | インプット、小さなバッジ |
| `--radius-md` | `8px` | ボタン、ドロップダウン |
| `--radius-lg` | `10px` | カード、パネル |
| `--radius-xl` | `16px` | モーダル、大きなコンテナ |
| `--radius-full` | `9999px` | ピル型ボタン、アバター |

## Shadow

| トークン | 値 | 用途 |
|---------|-----|------|
| `--shadow-sm` | `0 1px 2px oklch(0.20 0 0 / 0.04)` | ボタン、小さな要素 |
| `--shadow-md` | `0 2px 8px oklch(0.20 0 0 / 0.06)` | カードホバー、ドロップダウン |
| `--shadow-lg` | `0 4px 16px oklch(0.20 0 0 / 0.08)` | モーダル、ポップオーバー |

※ 通常状態ではシャドウを使わず、ボーダー（`--color-neutral-200`）で区切る。シャドウはホバーやフローティング要素にのみ使用。

## Transition

| トークン | 値 | 用途 |
|---------|-----|------|
| `--transition-fast` | `0.1s ease` | カラー変化、opacity |
| `--transition-default` | `0.15s ease` | ホバー、フォーカス |
| `--transition-slow` | `0.25s ease` | パネル展開、モーダル |

## CSS カスタムプロパティ一覧

```css
:root {
  /* Primary */
  --color-primary-lighter: oklch(0.95 0.03 250);
  --color-primary-light: oklch(0.82 0.07 250);
  --color-primary: oklch(0.65 0.12 250);
  --color-primary-dark: oklch(0.52 0.12 250);
  --color-primary-darker: oklch(0.40 0.12 250);

  /* Accent */
  --color-accent: oklch(0.65 0.15 270);
  --color-accent-light: oklch(0.90 0.05 270);

  /* Neutral */
  --color-neutral-50: oklch(0.98 0.002 250);
  --color-neutral-100: oklch(0.96 0.004 250);
  --color-neutral-150: oklch(0.94 0.004 250);
  --color-neutral-200: oklch(0.92 0.005 250);
  --color-neutral-300: oklch(0.86 0.008 250);
  --color-neutral-400: oklch(0.72 0.015 250);
  --color-neutral-500: oklch(0.60 0.02 250);
  --color-neutral-600: oklch(0.50 0.02 250);
  --color-neutral-700: oklch(0.40 0.02 250);
  --color-neutral-800: oklch(0.30 0.02 250);
  --color-neutral-900: oklch(0.20 0.02 250);

  /* Semantic */
  --color-success: oklch(0.60 0.15 155);
  --color-success-light: oklch(0.95 0.04 155);
  --color-warning: oklch(0.75 0.15 80);
  --color-warning-light: oklch(0.95 0.05 80);
  --color-error: oklch(0.60 0.20 25);
  --color-error-light: oklch(0.95 0.04 25);
  --color-info: oklch(0.65 0.12 250);
  --color-info-light: oklch(0.95 0.03 250);

  /* Text on colored backgrounds */
  --color-on-primary: oklch(1.0 0 0);

  /* Background */
  --color-bg-page: oklch(0.98 0.002 250);
  --color-bg-card: oklch(1.0 0 0);
  --color-bg-section: oklch(0.96 0.004 250);
  --color-bg-header: oklch(1.0 0 0);

  /* Typography */
  --font-heading: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --text-xs: clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem);
  --text-sm: clamp(0.75rem, 0.7rem + 0.15vw, 0.8125rem);
  --text-base: clamp(0.8125rem, 0.78rem + 0.15vw, 0.875rem);
  --text-lg: clamp(0.9375rem, 0.9rem + 0.15vw, 1rem);
  --text-xl: clamp(1.125rem, 1.05rem + 0.2vw, 1.25rem);
  --text-2xl: clamp(1.375rem, 1.25rem + 0.3vw, 1.5rem);
  --text-3xl: clamp(1.75rem, 1.6rem + 0.4vw, 2rem);
  --weight-normal: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --leading-tight: 1.3;
  --leading-normal: 1.6;
  --leading-relaxed: 1.8;
  --tracking-tight: -0.02em;
  --tracking-normal: 0;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  --space-section: 48px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadow */
  --shadow-sm: 0 1px 2px oklch(0.20 0 0 / 0.04);
  --shadow-md: 0 2px 8px oklch(0.20 0 0 / 0.06);
  --shadow-lg: 0 4px 16px oklch(0.20 0 0 / 0.08);

  /* Transition */
  --transition-fast: 0.1s ease;
  --transition-default: 0.15s ease;
  --transition-slow: 0.25s ease;
}
```
