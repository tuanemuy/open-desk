# Frontend Review #2

**Date:** 2026-04-08
**Round:** 2回目

---

## Summary

- Blockers: 4
- Warnings: 8
- Verdict: **BLOCKED**

---

## Blockers

- **[B-001]** GlobalHeader nav labels in English (should be Japanese per design)
- **[B-002]** Search placeholder "Search" should be "全体検索"
- **[B-003]** Missing gear icon for admin page navigation
- **[B-004]** User avatar is Link to /settings but design shows non-link avatar

## Warnings

- **[W-001]** extractAppName returns appId (no app name in DTO)
- **[W-002]** Add dialog / panel state interaction
- **[W-003]** Duplicate LicenseInfo type
- **[W-004]** includeSubs not in updatePermission schema
- **[W-005]** SELECT_CLASSES duplicated in security/login
- **[W-006]** features/action stubs (backend waiting)
- **[W-007]** header-color/loader hardcoded (backend waiting)
- **[W-008]** "詳細を見る" is span not link
