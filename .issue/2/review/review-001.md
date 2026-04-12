# PR Review #001 — fix: add /spaces/new and /apps/store routes

**PR:** #10
**Date:** 2026-04-12
**Round:** 1回目

---

## Summary

- Blockers: 2
- Warnings: 8
- Notes: 10
- Verdict: **BLOCKED**

---

### Frontend

#### Blockers
- **[B-001]** `defaultChecked={isGuest}` on isPrivate checkbox が Conform の内部状態管理と衝突する
  - 場所: `app/routes/spaces/new/index.tsx:104-106`
  - 理由: `getInputProps` が生成する `defaultChecked` と手動の `defaultChecked={isGuest}` が衝突。Conform がフォームリセット時に自身の initialValue を使うため不整合が生じる。
  - 提案: `useForm` の `defaultValue` にゲストモード時の初期値を渡す

#### Warnings
- **[W-001]** `form.errors` 配列がセパレータなしで結合される
  - 場所: `app/routes/spaces/new/index.tsx:76`, `app/routes/apps/store/index.tsx:74`
  - 提案: `.join(", ")` か map で個別表示

- **[W-002]** `px-lg px-xl` が重複（Tailwind のプロパティ衝突）
  - 場所: `app/routes/spaces/new/index.tsx:46`, `app/routes/apps/store/index.tsx:43`
  - 提案: 一方のみ使用するかレスポンシブプレフィックスを付与

- **[W-003]** ゲストモード時に `isPrivate` の hidden input がない
  - 場所: `app/routes/spaces/new/index.tsx:103-107`
  - 提案: 明示性のため hidden input で `isPrivate=true` を送信

### Security

#### Blockers
- **[B-002]** `isGuest` hidden field がクライアントサイドで改ざん可能
  - 場所: `app/routes/spaces/new/action.server.ts:42`, `app/routes/spaces/new/index.tsx:69`
  - 理由: hidden field は DevTools で変更可能。URL params から取得すべき
  - 提案: action 内で `new URL(args.request.url).searchParams.get("guest") === "true"` を使用

#### Warnings
- **[W-004]** `requireAuth` の redirect が try-catch で飲み込まれる
  - 場所: `app/routes/spaces/new/action.server.ts:25-30`, `app/routes/apps/store/action.server.ts:18-23`
  - 提案: 既存パターンへの追従なので今回は認識のみ

### Interface Adapter

#### Warnings
- **[W-005]** `createAppBlankSchema` の name にバリデーション制約（min(1)）がない
  - 場所: `app/routes/apps/store/schemas.ts:4`
  - 提案: `z.string().min(1).default("New App")` に変更

- **[W-006]** plan.md のデフォル��名「新しいアプリ」vs 実装 "New App"
  - 場所: `app/routes/apps/store/schemas.ts:4`
  - 提案: UIが英語なので "New App" で問題なし。plan.md を更新

- **[W-007]** admin 系ルートの import 順序変更がスコープ外
  - 場所: `app/routes/admin/` 配下5ファイル
  - 提案: linter 自動修正の副作用。破壊的変更ではないため許容

#### Notes
- [N-001] compositeAction パターンの使い方が既存実装と完全一致
- [N-002] ルート定義の順序が正確
- [N-003] MemberEntity.create の構築が型安全
- [N-004] CSRF 対策は SameSite=Lax で標準的
- [N-005] XSS 対策は React の自動エスケープで適切
- [N-006] loader/action のパターンが docs/frontend_implementation_example.md と一致

---

## Design Decisions

特になし
