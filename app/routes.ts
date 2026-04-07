import {
  index,
  layout,
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  /* Public routes */
  index("routes/index.tsx"),
  route("login", "routes/login/index.tsx"),

  /* Authenticated routes — wrapped by AppLayout */
  layout("routes/layout.tsx", [
    route("portal", "routes/portal/index.tsx"),
    route("apps", "routes/apps/index.tsx"),
    route("apps/:appId", "routes/apps/app/index.tsx"),
    route("apps/:appId/records/new", "routes/apps/app/records/new/index.tsx"),
    route(
      "apps/:appId/records/:recordId",
      "routes/apps/app/records/record/index.tsx",
    ),
    route("apps/:appId/settings", "routes/apps/app/settings/index.tsx"),
    route("spaces/:spaceId", "routes/spaces/space/index.tsx"),
    route(
      "spaces/:spaceId/threads/:threadId",
      "routes/spaces/space/threads/thread/index.tsx",
    ),
    route("people", "routes/people/index.tsx"),
    route("people/:userId", "routes/people/user/index.tsx"),
    route("messages", "routes/messages/index.tsx"),
    route("messages/:threadId", "routes/messages/thread/index.tsx"),
    route("notifications", "routes/notifications/index.tsx"),
    route("search", "routes/search/index.tsx"),
    route("settings", "routes/settings/index.tsx"),
  ]),
] satisfies RouteConfig;
