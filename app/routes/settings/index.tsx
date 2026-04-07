import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { Link } from "react-router";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import { handlers } from "./action";
import type { TimeFormat } from "./loader";

export { action } from "./action";
export { loader } from "./loader";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "個人設定 - OpenDesk" }];
}

export default function SettingsPage({ loaderData }: Route.ComponentProps) {
  const { sections, activeSection, timeFormat: initialTimeFormat } = loaderData;
  const [currentSection, setCurrentSection] = useState(activeSection);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(initialTimeFormat);

  const fetcher = useCompositeAction<typeof handlers>();

  const [form] = useForm({
    id: "time-format-form",
    lastResult:
      fetcher.data?.intent === "updateTimeFormat" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.updateTimeFormat.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: handlers.updateTimeFormat.schema,
      });
    },
  });

  const isPending = fetcher.isPending("updateTimeFormat");

  return (
    <div className="mx-auto max-w-[1400px] px-xl py-xl pb-3xl">
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        個人設定
      </h2>

      {/* Two Column Layout */}
      <div className="flex items-start gap-lg">
        {/* Left Sidebar: Navigation */}
        <aside className="w-[220px] shrink-0">
          <div className="rounded-lg border border-neutral-200 bg-bg-card py-md">
            <div className="mb-xs px-lg py-sm text-xs font-[var(--weight-semibold)] uppercase tracking-[0.05em] text-neutral-500">
              OpenDesk の設定
            </div>
            <ul className="list-none">
              {sections.map((section) => {
                const isActive = section.id === currentSection;
                return (
                  <li key={section.id}>
                    <Link
                      to="#"
                      className={`block border-l-2 px-lg py-sm text-sm no-underline transition-[color,background-color,border-color] duration-[var(--transition-default)] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
                        isActive
                          ? "border-l-primary bg-primary-lighter font-[var(--weight-medium)] text-primary"
                          : "border-l-transparent font-[var(--weight-normal)] text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentSection(section.id);
                      }}
                    >
                      {section.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Main: Settings Content */}
        <main className="min-w-0 flex-1">
          <div className="rounded-lg border border-neutral-200 bg-bg-card p-xl">
            <h3 className="mb-lg border-b border-neutral-200 pb-md font-heading text-lg font-[var(--weight-semibold)] leading-tight text-neutral-900">
              時刻表記
            </h3>

            <fetcher.Form method="post" {...getFormProps(form)}>
              <input type="hidden" name="intent" value="updateTimeFormat" />

              <fieldset className="m-0 border-none p-0">
                <legend className="sr-only">
                  時刻の表示形式を選択してください
                </legend>
                <div className="mb-xl flex flex-col gap-md">
                  <label className="flex cursor-pointer items-center gap-sm">
                    <input
                      type="radio"
                      name="timeFormat"
                      value="12h"
                      checked={timeFormat === "12h"}
                      onChange={() => setTimeFormat("12h")}
                      className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
                    />
                    <span className="leading-normal text-neutral-800 select-none">
                      12時間表記{" "}
                      <span className="text-sm text-neutral-500">
                        （例：午後5:00）
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-sm">
                    <input
                      type="radio"
                      name="timeFormat"
                      value="24h"
                      checked={timeFormat === "24h"}
                      onChange={() => setTimeFormat("24h")}
                      className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
                    />
                    <span className="leading-normal text-neutral-800 select-none">
                      24時間表記{" "}
                      <span className="text-sm text-neutral-500">
                        （例：17:00）
                      </span>
                    </span>
                  </label>
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={isPending}
                className="h-[38px] rounded-md border-none bg-primary px-xl font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:bg-primary-darker disabled:opacity-60"
              >
                {isPending ? "保存中..." : "保存"}
              </button>
            </fetcher.Form>
          </div>
        </main>
      </div>
    </div>
  );
}
