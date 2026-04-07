import { NavLink, Outlet } from "react-router";

type NavItem = {
  label: string;
  to: string;
};

type NavSubcategory = {
  label: string;
  items: NavItem[];
};

type NavCategory = {
  label: string;
  items: NavItem[];
  subcategories: NavSubcategory[];
};

type NavTopLevelLink = {
  label: string;
  to: string;
};

type NavSection =
  | { kind: "link"; link: NavTopLevelLink }
  | { kind: "category"; category: NavCategory };

const NAV_SECTIONS: NavSection[] = [
  {
    kind: "link",
    link: { label: "ホーム", to: "/admin" },
  },
  {
    kind: "category",
    category: {
      label: "ユーザー管理",
      items: [
        { label: "組織/ユーザー", to: "/admin/directory" },
        { label: "サービスの利用ユーザー", to: "/admin/directory/service" },
        { label: "役職", to: "/admin/title" },
        { label: "グループ（ロール）", to: "/admin/group" },
      ],
      subcategories: [
        {
          label: "一括操作",
          items: [
            { label: "ファイルからの読み込み", to: "/admin/csvimport" },
            { label: "ファイルへの書き出し", to: "/admin/csvexport" },
            { label: "ユーザーの一括削除", to: "/admin/directory/delete-user" },
          ],
        },
      ],
    },
  },
  {
    kind: "category",
    category: {
      label: "ユーザー管理",
      items: [
        { label: "管理者の設定", to: "/admin/administrators" },
        { label: "組織の事前設定", to: "/admin/sandbox" },
        { label: "組織間のアクセス権", to: "/admin/org-access-control" },
        { label: "プロビジョニング", to: "/admin/provisioning" },
      ],
      subcategories: [],
    },
  },
  {
    kind: "category",
    category: {
      label: "システム管理",
      items: [],
      subcategories: [
        {
          label: "セキュリティ",
          items: [
            { label: "ログイン", to: "/admin/security/login" },
            { label: "アクセス制限", to: "/admin/security/network" },
          ],
        },
        {
          label: "監査ログ",
          items: [
            { label: "閲覧とダウンロード", to: "/admin/audit" },
            { label: "設定", to: "/admin/audit/settings" },
          ],
        },
        {
          label: "外部連携",
          items: [
            { label: "OAuth", to: "/admin/integrations/oauth" },
            { label: "APIトークン", to: "/admin/integrations/apitoken" },
            { label: "その他の設定", to: "/admin/integrations/misc" },
            { label: "システムメール", to: "/admin/system-mail" },
            { label: "ロケール", to: "/admin/localization" },
          ],
        },
        {
          label: "カスタマイズ",
          items: [
            { label: "ロゴ", to: "/admin/header-setting" },
            { label: "ログインページ", to: "/admin/login-setting" },
            { label: "アップデートオプション", to: "/admin/update-option" },
          ],
        },
      ],
    },
  },
  {
    kind: "category",
    category: {
      label: "各サービスの設定",
      items: [{ label: "OpenDesk", to: "/admin/service-management" }],
      subcategories: [],
    },
  },
];

function NavItemLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end
      className={({ isActive }) =>
        `block py-xs pr-lg text-base no-underline transition-[color,background-color] duration-[var(--transition-default)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
          isActive
            ? "bg-primary-lighter font-[var(--weight-normal)] text-primary"
            : "font-[var(--weight-normal)] text-neutral-800 hover:bg-neutral-100"
        }`
      }
      style={{ paddingLeft: "calc(24px + 32px)" }}
    >
      {item.label}
    </NavLink>
  );
}

export default function AdminCybozuLayout() {
  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="sticky top-[56px] h-[calc(100vh-56px)] w-[260px] shrink-0 overflow-y-auto border-r border-neutral-200 bg-bg-card [&::-webkit-scrollbar-thumb:hover]:bg-neutral-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-[6px]">
        {/* Title */}
        <div className="border-b border-neutral-200 px-lg pb-md pt-lg font-heading text-lg font-[var(--weight-semibold)] tracking-tight text-neutral-900">
          cybozu.com共通管理
        </div>

        {/* Navigation */}
        <nav className="py-sm">
          {NAV_SECTIONS.map((section) => {
            if (section.kind === "link") {
              return (
                <NavLink
                  key={section.link.to}
                  to={section.link.to}
                  end
                  className={({ isActive }) =>
                    `block px-lg py-sm text-sm font-[var(--weight-semibold)] no-underline transition-[color,background-color] duration-[var(--transition-default)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
                      isActive
                        ? "bg-primary-lighter text-primary"
                        : "text-neutral-700 hover:bg-neutral-100"
                    }`
                  }
                >
                  {section.link.label}
                </NavLink>
              );
            }

            const { category } = section;
            return (
              <div key={category.label + category.items[0]?.to}>
                {/* Category header */}
                <div className="mt-xs cursor-default border-b border-t border-neutral-200 bg-neutral-100 px-lg py-sm text-sm font-[var(--weight-semibold)] text-neutral-700 select-none first:mt-0 first:border-t-0">
                  {category.label}
                </div>

                {/* Direct items */}
                {category.items.map((item) => (
                  <NavItemLink key={item.to} item={item} />
                ))}

                {/* Subcategories */}
                {category.subcategories.map((sub) => (
                  <div key={sub.label}>
                    <div
                      className="mt-xs cursor-default py-xs text-sm font-[var(--weight-medium)] text-neutral-600 select-none"
                      style={{ paddingLeft: "calc(24px + 16px)" }}
                    >
                      {sub.label}
                    </div>
                    {sub.items.map((item) => (
                      <NavItemLink key={item.to} item={item} />
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1 px-2xl py-xl" style={{ maxWidth: 1140 }}>
        <Outlet />
      </main>
    </div>
  );
}
