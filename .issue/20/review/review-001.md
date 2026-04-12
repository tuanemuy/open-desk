# PR Review #001 — fix: include domain layer tests in test:domain script

**PR:** #25
**Date:** 2026-04-13
**Round:** 1回目

---

## Summary

- Blockers: 0
- Warnings: 0
- Notes: 1
- Verdict: **APPROVED**

---

### Infrastructure

#### Blockers
なし

#### Warnings
なし

#### Notes
- **[N-001]** vitest CLI に複数のフィルターパスを渡す方法は正しいアプローチ。`app/core/domain/${TEST_DOMAIN}` と `app/core/application/${TEST_DOMAIN}` の順序でパスを指定しており、実行結果でも両レイヤーのテストが正常に実行されることを確認済み（39ファイル、355テスト全PASS）。

---

### Test

#### Blockers
なし

#### Warnings
なし

#### Notes
なし — テストコマンド自体の修正であり、テスト実行結果で動作を直接確認済み。

---

## Design Decisions

特になし
