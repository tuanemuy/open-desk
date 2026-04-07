# Frontend Review #1

**Date:** 2026-04-08
**Round:** 1回目

---

## Summary

- Blockers: 32 (Bookmark: 4, Admin: 28)
- Warnings: 19 (Bookmark: 6, Admin: 13)
- Verdict: **BLOCKED**

---

## Bookmark

### Blockers

- **[B-001]** URL categorization pattern mismatch -- domain categorization uses `/k/` but app routes use `/apps/`
- **[B-002]** extractAppName uses wrong URL pattern and returns generic "App {id}" instead of actual app name
- **[B-003]** Missing toast notification on bookmark creation (spec requires it)
- **[B-004]** Accordion chevron rotation differs from HTML design

### Warnings

- **[W-001]** Flat list items missing pl-xl padding
- **[W-002]** Error handling uses console.error instead of user-facing feedback
- **[W-003]** bookmarks prop unnecessarily optional
- **[W-004]** document.title auto-fill doesn't follow spec page-type rules
- **[W-005]** No keyboard navigation between tabs
- **[W-006]** api/bookmarks resource route outside authenticated layout

## Admin

### Blockers

- **[B-001~B-026]** Multiple loaders/actions return hardcoded stub data instead of connecting to backend APIs
  - Many are due to missing backend use cases (system settings, audit logs, plugins, etc.)
  - Some have available use cases but weren't connected (apps loader)
- **[B-027]** Duplicate "ユーザー管理" category in cybozu admin sidebar
- **[B-028]** admin/index.tsx routing issue -- `index()` in pathless layout may not resolve to `/admin`

### Warnings

- **[W-001~W-013]** Code duplication (LicenseCard, progressLevel, formatDate, SELECT_CLASSES), missing shared components, incomplete CRUD operations
