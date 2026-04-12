# PR Review #002 — refactor: extract inline loader to loader.server.ts in system-mail route

**PR:** #16
**Date:** 2026-04-12
**Round:** 2回目

---

## Summary

- Blockers: 0
- Warnings: 0
- Notes: 10
- Verdict: **APPROVED**

---

### Infrastructure / ルーティング・バンドル分離

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-001]** サーバー専用 import の完全な分離が正しく行われている。`import type { handlers }` は TypeScript の type import であり、コンパイル時に除去される。
- **[N-002]** re-export パターンが `group`, `directory`, `localization` 等の全 admin ルートと一貫している。
- **[N-003]** `.server.ts` サフィックスによるバンドル境界が React Router v7 / Vite で正しく機能する。
- **[N-004]** loader ロジックの同一性が文字単位で保たれている。
- **[N-005]** 実装計画との整合性が完全に取れている。スコープ外の変更なし。

---

### Frontend / コンポーネント・import整理

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-006]** `index.tsx` の全 import (7行 / 9シンボル) を1つずつ検証し、全て使用されていることを確認。未使用 import なし。
- **[N-007]** `loader.server.ts` 側の import (6シンボル) も全て使用されており、未使用 import なし。
- **[N-008]** re-export パターン・構造順序（import → re-export → meta → default export）が既存ルートと完全一致。
- **[N-009]** `toast` (sonner) はクライアント専用ライブラリで `index.tsx` のみに留まっており問題なし。
- **[N-010]** `./schemas` からの import はクライアント/サーバー両方で使われる設計として適切。

---

## Design Decisions

特になし
