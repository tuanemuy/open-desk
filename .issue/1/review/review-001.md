# PR Review #001 — fix: separate server-only modules from client bundle to fix React hydration

**PR:** #5
**Date:** 2026-04-12
**Round:** 1回目

---

## Summary

- Blockers: 0
- Warnings: 3
- Notes: 6
- Verdict: **APPROVED** (Warningは軽微で修正済み)

---

### Infrastructure / Module Boundaries

#### Blockers
なし

#### Warnings
- **[W-001]** 14ファイルで `import type { handlers }` が `export` 文の後に配置 → **修正済み**
- **[W-002]** 11ファイルでスキーマが index.tsx と action.server.ts に重複定義 → **見送り** (スコープ外: これらは元々インラインで同居しており、今回の分離で意図的に残したもの)
- **[W-003]** BookmarkPanel.tsx が -impl.server ファイルを直接参照 → **修正済み** (bookmarks.ts に型re-export追加)

#### Notes
- **[N-001]** 全48ファイルのリネームが正確に実施されている
- **[N-002]** 全 re-export パスが正しく更新されている
- **[N-003]** `import type` の使用が適切で、verbatimModuleSyntax: true と整合
- **[N-004]** bookmarks API ルートの分離パターンは適切
- **[N-005]** インライン loader のみのファイルは React Router の自動除去で問題なし
- **[N-006]** schemas.ts は純粋な Zod 定義のみでサーバー依存なし

---

### Frontend / Component Design

#### Blockers
なし

#### Warnings
（Infrastructure と重複のため省略 — W-001, W-002, W-003 は同じ）

#### Notes
- **[N-001]** `import type` + `typeof handlers` パターンは正しく型推論が機能
- **[N-002]** Conform の getZodConstraint / parseWithZod がスキーマを正しく参照
- **[N-003]** 4ファイルの value → type import 変更が正確

---

## Design Decisions

特になし（既にADRに記録済み）
