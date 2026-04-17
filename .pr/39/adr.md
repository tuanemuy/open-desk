# ADR — PR #39: Implement record detail edit/delete/reuse flows

## ADR-001: Separate record form browser helpers from server-only loading code

### Status
Proposed

### Context
The PR introduced a shared `app/routes/apps/app/records/form.ts` module that was imported transitively by route components through `new/schemas.ts` and `edit/schemas.ts`. Because that module also imported `container/server.instance` and other server-only dependencies, the browser bundle crossed the server/client boundary.

### Decision
Keep `app/routes/apps/app/records/form.ts` client-safe and move repository/container-backed data loading into `app/routes/apps/app/records/form.server.ts`.

### Consequences
Route components can keep importing shared schemas and field-mapping helpers without pulling server-only code into the client bundle, and loader code still reuses the server-side form bootstrap logic.

---

## ADR-002: Defer cross-cutting refactors to follow-up issues to keep PR #39 scoped

### Status
Accepted

### Context
During the PR #39 review several structural issues surfaced that are either reruns of existing repo-wide patterns or would significantly expand the diff beyond the record detail flows the PR is meant to deliver:

- JSX duplication between `edit/index.tsx` and `new/index.tsx` (~320 lines)
- `form.server.ts` accessing repositories directly instead of going through a use case
- `FieldDefinition` being re-declared inside the route layer instead of using the domain `Field` type
- `reuseRecord` use case requiring a `creatorId` even though the loader never persists the draft
- No route-layer integration tests for the edit / delete / reuse wiring
- `setFieldValue` using an `as EditableFieldValue` assertion because TypeScript cannot narrow the union through a parameter

### Decision
Keep PR #39 focused on the UX / a11y fixes, loader parallelization and `form.ts` hardening surfaced during review, and hand off the structural rework to dedicated follow-up issues:

- #40 — extract `RecordFormFields` component
- #41 — move `form.server.ts` repository access behind a use case
- #42 — replace `FieldDefinition` with the domain `Field` type
- #43 — relax `reuseRecord` contract (drop `creatorId` requirement)
- #44 — add integration tests for edit / delete / reuse flows
- #45 — type-safe FieldValue construction helper in the domain layer

### Consequences
PR #39 stays reviewable and ships the record detail flows it promised. The structural debt is made explicit in the issue tracker instead of growing silently; each follow-up can be scoped and reviewed on its own.
