import { Plus } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import {
  createCompositeAction,
  defineHandler,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type OAuthIntegration = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const integrations: OAuthIntegration[] = [
    {
      id: "power-automate",
      name: "Microsoft Power Automate",
      description: "Power Automateとの連携を有効にします",
      enabled: true,
    },
    {
      id: "slack",
      name: "Slack",
      description: "Slackとの連携を有効にします",
      enabled: false,
    },
  ];

  return { integrations };
}

const toggleIntegrationSchema = z.object({
  integrationId: z.string().min(1),
  enabled: z.string(),
});

export const handlers = {
  toggleIntegration: defineHandler({
    schema: toggleIntegrationSchema,
    handler: async (_value, args) => {
      await requireAuth(args.request, container);
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "外部連携 > OAuth - cybozu.com共通管理 - OpenDesk" }];
}

function ToggleSwitch({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
}) {
  return (
    <label
      className="relative inline-block h-[24px] w-[44px] shrink-0"
      htmlFor={id}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="absolute h-0 w-0 opacity-0 [&:checked+span::before]:translate-x-[20px] [&:checked+span]:bg-primary [&:focus-visible+span]:outline-2 [&:focus-visible+span]:outline-offset-2 [&:focus-visible+span]:outline-primary"
      />
      <span className="absolute inset-0 cursor-pointer rounded-full bg-neutral-300 transition-[background-color] duration-[var(--transition-default)] before:absolute before:top-[2px] before:left-[2px] before:h-[20px] before:w-[20px] before:rounded-full before:bg-bg-card before:shadow-sm before:transition-transform before:duration-[var(--transition-default)] before:content-['']" />
    </label>
  );
}

export default function OAuthPage({ loaderData }: Route.ComponentProps) {
  const { integrations: initialIntegrations } = loaderData;
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const fetcher = useCompositeAction<typeof handlers>();

  const handleToggle = (id: string, enabled: boolean) => {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id ? { ...integration, enabled } : integration,
      ),
    );

    const formData = new FormData();
    formData.set("intent", "toggleIntegration");
    formData.set("integrationId", id);
    formData.set("enabled", String(enabled));
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        外部連携 &gt; OAuth
      </h2>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
        <div className="p-lg">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="flex items-center justify-between border-b border-neutral-200 py-md last:border-b-0"
            >
              <div className="flex flex-col gap-[2px]">
                <span className="text-base font-[var(--weight-medium)] text-neutral-800">
                  {integration.name}
                </span>
                <span className="text-xs text-neutral-500">
                  {integration.description}
                </span>
              </div>
              <div className="flex items-center">
                <ToggleSwitch
                  id={`toggle-${integration.id}`}
                  checked={integration.enabled}
                  onChange={(checked) => handleToggle(integration.id, checked)}
                />
                <span
                  className={`ml-sm text-xs font-[var(--weight-medium)] ${
                    integration.enabled ? "text-success" : "text-neutral-400"
                  }`}
                >
                  {integration.enabled ? "ON" : "OFF"}
                </span>
              </div>
            </div>
          ))}

          {/* Add OAuth Client */}
          <button
            type="button"
            className="mt-md inline-flex items-center gap-xs bg-transparent text-sm font-[var(--weight-medium)] text-primary transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
          >
            <Plus className="h-[14px] w-[14px]" />
            OAuthクライアントの追加
          </button>
        </div>
      </div>
    </section>
  );
}
