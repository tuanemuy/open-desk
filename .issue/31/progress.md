# 進捗メモ — Issue #31

## 1. ブラウザ手動確認は未実施

- **内容:** `spec/manual-tests/record-crud.md` の TC-006 から TC-009 相当のブラウザ操作は、この実行では未実施。
- **理由:** ターミナル上での実装・型検査・自動テストまでは完了したが、ブラウザ操作環境はこのフロー内で起動していない。
- **影響範囲:** UI の導線と文言はコード上で揃っているが、実ブラウザでの最終確認は `testing.md` に従って別途実施が必要。

## 2. `pnpm build` は既存の browser bundling 問題で失敗

- **内容:** `pnpm build` は `app/core/adapters/auth/authenticationProvider.ts` の `node:crypto` import が browser bundle に混入する既存エラーで失敗した。
- **理由:** 今回の差分は record detail/edit/new の route 実装であり、auth adapter の bundling 問題は Issue #31 のスコープ外。
- **影響範囲:** Issue #31 の型検査とテストは通っているが、リポジトリ全体の build 健全性は別課題として残る。
