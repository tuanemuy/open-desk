import { Link } from "react-router";
import { container } from "@/core/application/container/server.instance";
import { getDiskUsage } from "@/core/application/system-settings/getDiskUsage";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type UsageItem = {
  label: string;
  used: number;
  limit: number;
};

type ServiceCard = {
  name: string;
  description: string;
};

type ContractData = {
  courseName: string;
  usageItems: UsageItem[];
  diskUsedGb: number;
  diskLimitGb: number;
  additionalServices: ServiceCard[];
};

export async function loader({ request }: Route.LoaderArgs) {
  const headers = request.headers;
  await requireAuth(request, container);

  const { userCount, appCount, spaceCount } =
    await container.unitOfWorkProvider.transaction(async (ctx) => {
      const userListResult = await ctx.userRepository.list({
        offset: 0,
        limit: 1,
      });
      const appCount = await ctx.appRepository.countAll();
      const spaceCount = await ctx.spaceRepository.count({});

      return {
        userCount: userListResult.totalCount,
        appCount,
        spaceCount,
      };
    });

  const { usedBytes, limitBytes } = await getDiskUsage({
    container,
    headers,
    input: undefined,
  });

  const bytesPerGb = 1024 * 1024 * 1024;
  const diskUsedGb = Math.round((usedBytes / bytesPerGb) * 100) / 100;
  const diskLimitGb = Math.round((limitBytes / bytesPerGb) * 100) / 100;

  const contractData: ContractData = {
    courseName: "OpenDesk スタンダードコース",
    usageItems: [
      { label: "ユーザー", used: userCount, limit: 50 },
      { label: "アプリ", used: appCount, limit: 1000 },
      { label: "スペース", used: spaceCount, limit: 500 },
    ],
    diskUsedGb,
    diskLimitGb,
    additionalServices: [
      {
        name: "Garoon",
        description:
          "スケジュール、ワークフロー、掲示板等を備えた中堅・大企業向けグループウェア",
      },
      {
        name: "サイボウズ Office",
        description: "中小企業向けの使いやすいグループウェア",
      },
      {
        name: "OpenDesk メール共有オプション",
        description: "メール共有・管理機能をOpenDeskに追加するオプション",
      },
      {
        name: "メールワイズ",
        description: "チームでのメール対応を効率化するメール共有システム",
      },
      {
        name: "セキュアアクセス",
        description: "クライアント証明書によるアクセス制御オプション",
      },
    ],
  };

  return { contractData };
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "契約状況 - cybozu.com共通管理 - OpenDesk" }];
}

function getUsageLevel(percent: number): "low" | "medium" | "high" {
  if (percent >= 80) return "high";
  if (percent >= 50) return "medium";
  return "low";
}

const LEVEL_COLORS = {
  low: {
    bar: "bg-success",
    text: "text-success",
  },
  medium: {
    bar: "bg-warning",
    text: "text-warning",
  },
  high: {
    bar: "bg-error",
    text: "text-error",
  },
} as const;

export default function AdminHomePage({ loaderData }: Route.ComponentProps) {
  const { contractData } = loaderData;
  const diskPercent = Math.round(
    (contractData.diskUsedGb / contractData.diskLimitGb) * 100,
  );
  const diskLevel = getUsageLevel(diskPercent);

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        契約状況
      </h2>

      {/* Contract Table Card */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
        <div className="p-lg">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                    項目
                  </th>
                  <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                    利用中
                  </th>
                  <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                    上限
                  </th>
                  <th
                    className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600"
                    style={{ minWidth: 200 }}
                  >
                    使用状況
                  </th>
                </tr>
              </thead>
              <tbody>
                {contractData.usageItems.map((item) => {
                  const percent =
                    Math.round((item.used / item.limit) * 100 * 10) / 10;
                  const level = getUsageLevel(percent);
                  const colors = LEVEL_COLORS[level];

                  return (
                    <tr
                      key={item.label}
                      className="border-b border-neutral-200 transition-colors duration-[var(--transition-default)] last:border-b-0 hover:bg-neutral-100"
                    >
                      <td className="px-md py-sm text-base font-[var(--weight-medium)] text-neutral-700">
                        {item.label}
                      </td>
                      <td className="px-md py-sm text-base">
                        {item.used.toLocaleString()}
                      </td>
                      <td className="px-md py-sm text-base">
                        {item.limit.toLocaleString()}
                      </td>
                      <td className="px-md py-sm">
                        <div className="flex items-center gap-sm">
                          <div className="h-[8px] min-w-[80px] flex-1 overflow-hidden rounded-full bg-neutral-200">
                            <div
                              className={`h-full rounded-full transition-[width] duration-[var(--transition-slow)] ${colors.bar}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span
                            className={`min-w-[36px] text-right text-xs font-[var(--weight-medium)] ${colors.text}`}
                          >
                            {percent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Disk Usage */}
          <div className="mt-md">
            <div className="mb-sm flex items-center justify-between">
              <span className="text-base font-[var(--weight-medium)] text-neutral-700">
                ディスク使用量
              </span>
              <span className="text-sm text-neutral-500">
                {contractData.diskUsedGb} GB / {contractData.diskLimitGb} GB
              </span>
            </div>
            <div className="h-[12px] overflow-hidden rounded-full bg-neutral-200">
              <div
                className={`h-full rounded-full transition-[width] duration-[var(--transition-slow)] ${LEVEL_COLORS[diskLevel].bar}`}
                style={{ width: `${diskPercent}%` }}
              />
            </div>
          </div>

          {/* Course Info */}
          <p className="mt-md text-xs text-neutral-500">
            {contractData.courseName}
          </p>
        </div>
      </div>

      {/* Additional Services */}
      <div className="mt-xl mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
        追加契約可能なサービス
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-md">
        {contractData.additionalServices.map((service) => (
          <div
            key={service.name}
            className="cursor-pointer rounded-lg border border-neutral-200 bg-bg-card p-lg transition-[border-color,box-shadow] duration-[var(--transition-default)] hover:border-primary-light hover:shadow-md"
          >
            <div className="mb-xs text-base font-[var(--weight-medium)] text-neutral-800">
              {service.name}
            </div>
            <div className="text-sm leading-normal text-neutral-500">
              {service.description}
            </div>
            <Link
              to="#"
              className="mt-sm inline-block text-sm font-[var(--weight-medium)] text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
            >
              詳細を見る
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
