# PR Review #001 — refactor: extract inline loader to loader.server.ts in system-mail route

**PR:** #16
**Date:** 2026-04-12
**Round:** 1回目

---

## Summary

- Blockers: 0
- Warnings: 0
- Notes: 11
- Verdict: **APPROVED**

---

### Infrastructure / ルーティング・バンドル分離

#### Blockers

なし

#### Warnings

なし（W-001 として挙がった `import type { handlers }` の `.server` 参照は既存コードの問題であり、この PR の変更ではないためスコープ外）

#### Notes

- **[N-001]** `loader.server.ts` のファイル構成は他ルート（`directory`, `group`, `localization` 等）と完全に一致。re-export パターンも同一で一貫性は完璧。
- **[N-002]** サーバー専用モジュール（`container`, `getSystemMail`, `handleUseCase`, `requireAuth`, `data`）が `index.tsx` から完全に除去され、`loader.server.ts` に移動されている。`.server.ts` サフィックスによりクライアントバンドルから自動除外される。
- **[N-003]** loader のロジックは元のインラインコードと差分ゼロで一字一句同一。ロジック変更がないことを確認済み。
- **[N-004]** `routes.ts` のルート定義は変更なし。React Router v7 の型生成も re-export を正しく辿る（他ルートで実績あり）。
- **[N-005]** admin 配下には約15ルートがまだインライン loader を持っているが、本PRのスコープ外。

---

### Frontend / コンポーネント・import整理

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-006]** `index.tsx` の残存 import は全てコンポーネント内で使用されており、不要な import の残留なし。
- **[N-007]** re-export パターンが `directory/index.tsx`, `group/index.tsx` 等と完全一致。
- **[N-008]** `loader.server.ts` の構造が `localization/loader.server.ts` と実質同一パターン。
- **[N-009]** `Route` 型が `./+types/index` から正しくインポートされており、型安全性維持。
- **[N-010]** loader ロジックは完全移動で変更・漏れなし。
- **[N-011]** import 順序が既存ルートの慣習に合致。

---

## Design Decisions

特になし
