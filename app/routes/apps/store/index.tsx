import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { Link, useNavigate } from "react-router";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import type { handlers } from "./action.server";
import { createAppBlankSchema } from "./schemas";

export { action } from "./action.server";
export { loader } from "./loader.server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "App Store - OpenDesk" }];
}

export default function AppStorePage({ loaderData }: Route.ComponentProps) {
  const { templates } = loaderData;
  const navigate = useNavigate();

  const fetcher = useCompositeAction<typeof handlers>();

  const [form] = useForm({
    id: "create-blank-app-form",
    lastResult:
      fetcher.data?.intent === "createBlank" ? fetcher.data : undefined,
    constraint: getZodConstraint(createAppBlankSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: createAppBlankSchema });
    },
  });

  fetcher.register("createBlank", {
    onSuccess: (data) => {
      navigate(`/apps/${data.data.appId}/settings`);
    },
  });

  const isPending = fetcher.isPending("createBlank");

  return (
    <div className="mx-auto max-w-[1400px] px-xl">
      {/* Breadcrumb */}
      <nav>
        <ol className="mb-md flex list-none items-center gap-xs text-sm text-neutral-500">
          <li>
            <Link
              to="/portal"
              className="text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
            >
              Portal
            </Link>
          </li>
          <li className="text-xs text-neutral-400">&gt;</li>
          <li>App Store</li>
        </ol>
      </nav>

      <h2 className="mb-lg font-heading text-xl font-[var(--weight-semibold)] tracking-tight text-neutral-900">
        App Store
      </h2>

      {/* Create from scratch */}
      <div className="mb-xl">
        <h3 className="mb-md font-heading text-base font-[var(--weight-semibold)] text-neutral-900">
          Create from Scratch
        </h3>
        <fetcher.Form method="post" {...getFormProps(form)}>
          <input type="hidden" name="intent" value="createBlank" />
          {/* Form-level errors */}
          {form.errors && form.errors.length > 0 && (
            <div className="mb-md rounded-sm border border-error bg-error/10 px-md py-sm text-sm text-error">
              {form.errors.map((e) => (
                <p key={e}>{e}</p>
              ))}
            </div>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-[36px] items-center gap-xs rounded-sm border border-primary bg-primary px-lg font-body text-base font-[var(--weight-medium)] text-on-primary transition-all duration-[var(--transition-default)] hover:border-primary-dark hover:bg-primary-dark disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create from Scratch"}
          </button>
        </fetcher.Form>
      </div>

      {/* Template list */}
      <div>
        <h3 className="mb-md font-heading text-base font-[var(--weight-semibold)] text-neutral-900">
          Templates
        </h3>
        {templates.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No templates available yet.
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-md">
            {templates.map((template) => (
              <div
                key={template.templateId}
                className="rounded-lg border border-neutral-200 bg-bg-card p-lg transition-[border-color] duration-[var(--transition-default)] hover:border-neutral-300"
              >
                <h4 className="mb-xs font-heading text-sm font-[var(--weight-semibold)] text-neutral-900">
                  {template.name}
                </h4>
                {template.description && (
                  <p className="text-xs leading-relaxed text-neutral-600">
                    {template.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
