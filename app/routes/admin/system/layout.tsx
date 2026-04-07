import { NavLink, Outlet } from "react-router";

type NavCategory = {
  label: string;
  items: { label: string; to: string }[];
};

const NAV_CATEGORIES: NavCategory[] = [
  {
    label: "アプリ",
    items: [
      { label: "アプリ管理", to: "/admin/system/apps" },
      { label: "アプリテンプレート", to: "/admin/system/templates" },
    ],
  },
  {
    label: "スペース",
    items: [
      { label: "スペース管理", to: "/admin/system/spaces" },
      { label: "スペーステンプレート", to: "/admin/system/space-templates" },
      { label: "スレッドのアクション", to: "/admin/system/thread-actions" },
    ],
  },
  {
    label: "ゲストユーザー",
    items: [
      { label: "ゲストユーザー管理", to: "/admin/system/guests" },
      { label: "ゲストユーザーの認証", to: "/admin/system/guest-auth" },
    ],
  },
  {
    label: "権限",
    items: [
      { label: "アクセス権", to: "/admin/system/acl" },
      { label: "アプリグループ", to: "/admin/system/app-groups" },
    ],
  },
  {
    label: "カスタマイズ",
    items: [
      {
        label: "JavaScript/CSSでカスタマイズ",
        to: "/admin/system/customize",
      },
      { label: "ヘッダーの色", to: "/admin/system/header-color" },
    ],
  },
  {
    label: "その他",
    items: [
      { label: "アップデートオプション", to: "/admin/system/update-options" },
      { label: "利用する機能の選択", to: "/admin/system/features" },
      { label: "プラグイン", to: "/admin/system/plugins" },
      { label: "スマートフォンでの表示", to: "/admin/system/mobile" },
      {
        label: "アプリ／スペースの復旧",
        to: "/admin/system/restore",
      },
      {
        label: "ユーザーのアクセス状況",
        to: "/admin/system/user-access",
      },
      { label: "アプリの共通設定", to: "/admin/system/shared-settings" },
    ],
  },
];

export default function AdminSystemLayout() {
  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="sticky top-[56px] h-[calc(100vh-56px)] w-[240px] shrink-0 overflow-y-auto border-r border-neutral-200 bg-bg-card py-lg">
        {NAV_CATEGORIES.map((category) => (
          <div key={category.label} className="mb-md px-md">
            <div className="px-sm py-sm text-sm font-[var(--weight-semibold)] uppercase text-neutral-600">
              {category.label}
            </div>
            <ul className="list-none">
              {category.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `block rounded-md px-md py-sm text-base no-underline transition-[color,background-color] duration-[var(--transition-default)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
                        isActive
                          ? "bg-primary-lighter font-[var(--weight-medium)] text-primary"
                          : "font-[var(--weight-normal)] text-neutral-700 hover:bg-neutral-100 hover:text-neutral-800"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      {/* Main Content */}
      <div
        className="min-w-0 flex-1 p-xl"
        style={{ maxWidth: "calc(1400px - 240px)" }}
      >
        <Outlet />
      </div>
    </div>
  );
}
