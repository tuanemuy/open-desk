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
    /* Resource routes (API) */
    route("api/bookmarks", "routes/api/bookmarks.ts"),

    route("portal", "routes/portal/index.tsx"),
    route("apps", "routes/apps/index.tsx"),
    route("apps/store", "routes/apps/store/index.tsx"),
    route("apps/:appId", "routes/apps/app/index.tsx"),
    route("apps/:appId/records/new", "routes/apps/app/records/new/index.tsx"),
    route(
      "apps/:appId/records/:recordId/edit",
      "routes/apps/app/records/edit/index.tsx",
    ),
    route(
      "apps/:appId/records/:recordId",
      "routes/apps/app/records/record/index.tsx",
    ),
    route("apps/:appId/settings", "routes/apps/app/settings/index.tsx"),
    route("spaces/new", "routes/spaces/new/index.tsx"),
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

    /* Admin: cybozu.com共通管理 */
    layout("routes/admin/layout.tsx", [
      route("admin", "routes/admin/index.tsx"),
      route("admin/directory", "routes/admin/directory/index.tsx"),
      route(
        "admin/directory/service",
        "routes/admin/directory/service/index.tsx",
      ),
      route(
        "admin/directory/delete-user",
        "routes/admin/directory/delete-user/index.tsx",
      ),
      route("admin/title", "routes/admin/title/index.tsx"),
      route("admin/group", "routes/admin/group/index.tsx"),
      route("admin/csvimport", "routes/admin/csvimport/index.tsx"),
      route("admin/csvexport", "routes/admin/csvexport/index.tsx"),
      route("admin/administrators", "routes/admin/administrators/index.tsx"),
      route("admin/sandbox", "routes/admin/sandbox/index.tsx"),
      route(
        "admin/org-access-control",
        "routes/admin/org-access-control/index.tsx",
      ),
      route("admin/provisioning", "routes/admin/provisioning/index.tsx"),
      route("admin/security/login", "routes/admin/security/login/index.tsx"),
      route(
        "admin/security/network",
        "routes/admin/security/network/index.tsx",
      ),
      route("admin/audit", "routes/admin/audit/index.tsx"),
      route("admin/audit/settings", "routes/admin/audit/settings/index.tsx"),
      route(
        "admin/integrations/oauth",
        "routes/admin/integrations/oauth/index.tsx",
      ),
      route(
        "admin/integrations/apitoken",
        "routes/admin/integrations/apitoken/index.tsx",
      ),
      route(
        "admin/integrations/misc",
        "routes/admin/integrations/misc/index.tsx",
      ),
      route("admin/system-mail", "routes/admin/system-mail/index.tsx"),
      route("admin/localization", "routes/admin/localization/index.tsx"),
      route("admin/header-setting", "routes/admin/header-setting/index.tsx"),
      route("admin/login-setting", "routes/admin/login-setting/index.tsx"),
      route("admin/update-option", "routes/admin/update-option/index.tsx"),
      route(
        "admin/service-management",
        "routes/admin/service-management/index.tsx",
      ),
    ]),

    /* Admin: OpenDesk system management */
    layout("routes/admin/system/layout.tsx", [
      route("admin/system/apps", "routes/admin/system/apps/index.tsx"),
      route(
        "admin/system/templates",
        "routes/admin/system/templates/index.tsx",
      ),
      route("admin/system/spaces", "routes/admin/system/spaces/index.tsx"),
      route(
        "admin/system/space-templates",
        "routes/admin/system/space-templates/index.tsx",
      ),
      route(
        "admin/system/thread-actions",
        "routes/admin/system/thread-actions/index.tsx",
      ),
      route("admin/system/guests", "routes/admin/system/guests/index.tsx"),
      route(
        "admin/system/guest-auth",
        "routes/admin/system/guest-auth/index.tsx",
      ),
      route("admin/system/acl", "routes/admin/system/acl/index.tsx"),
      route(
        "admin/system/app-groups",
        "routes/admin/system/app-groups/index.tsx",
      ),
      route(
        "admin/system/customize",
        "routes/admin/system/customize/index.tsx",
      ),
      route(
        "admin/system/header-color",
        "routes/admin/system/header-color/index.tsx",
      ),
      route(
        "admin/system/update-options",
        "routes/admin/system/update-options/index.tsx",
      ),
      route("admin/system/features", "routes/admin/system/features/index.tsx"),
      route("admin/system/plugins", "routes/admin/system/plugins/index.tsx"),
      route("admin/system/mobile", "routes/admin/system/mobile/index.tsx"),
      route("admin/system/restore", "routes/admin/system/restore/index.tsx"),
      route(
        "admin/system/user-access",
        "routes/admin/system/user-access/index.tsx",
      ),
      route(
        "admin/system/shared-settings",
        "routes/admin/system/shared-settings/index.tsx",
      ),
    ]),
  ]),
] satisfies RouteConfig;
