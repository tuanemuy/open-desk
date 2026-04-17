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
