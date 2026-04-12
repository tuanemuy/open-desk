import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { Link, useNavigate } from "react-router";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import type { handlers } from "./action.server";
import { createSpaceSchema } from "./schemas";

export { action } from "./action.server";
export { loader } from "./loader.server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Create Space - OpenDesk" }];
}

export default function NewSpacePage({ loaderData }: Route.ComponentProps) {
  const { isGuest } = loaderData;
  const navigate = useNavigate();

  const fetcher = useCompositeAction<typeof handlers>();

  const [form, fields] = useForm({
    id: "create-space-form",
    lastResult:
      fetcher.data?.intent === "createSpace" ? fetcher.data : undefined,
    constraint: getZodConstraint(createSpaceSchema),
    defaultValue: {
      isPrivate: isGuest ? "on" : undefined,
    },
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: createSpaceSchema });
    },
  });

  fetcher.register("createSpace", {
    onSuccess: (data) => {
      navigate(`/spaces/${data.data.spaceId}`);
    },
  });

  const isPending = fetcher.isPending("createSpace");

  const inputClasses =
    "w-full rounded-sm border border-neutral-300 bg-bg-card px-md py-sm font-body text-base leading-normal text-neutral-800 outline-none transition-[border-color] duration-[var(--transition-default)] placeholder:text-neutral-400 hover:not-focus:border-neutral-400 focus:border-primary";

  return (
    <div className="mx-auto max-w-[800px] px-xl">
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
          <li>{isGuest ? "Create Guest Space" : "Create Space"}</li>
        </ol>
      </nav>

      <h2 className="mb-lg font-heading text-xl font-[var(--weight-semibold)] tracking-tight text-neutral-900">
        {isGuest ? "Create Guest Space" : "Create Space"}
      </h2>

      <fetcher.Form
        method="post"
        action={isGuest ? "?guest=true" : undefined}
        {...getFormProps(form)}
      >
        <input type="hidden" name="intent" value="createSpace" />

        {/* Form Card */}
        <div className="mb-lg rounded-lg border border-neutral-200 bg-bg-card p-lg">
          {/* Form-level errors */}
          {form.errors && form.errors.length > 0 && (
            <div className="mb-md rounded-sm border border-error bg-error/10 px-md py-sm text-sm text-error">
              {form.errors.map((e) => (
                <p key={e}>{e}</p>
              ))}
            </div>
          )}

          {/* Space Name */}
          <div className="mb-lg">
            <label
              htmlFor={fields.name.id}
              className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
            >
              Space Name <span className="ml-[2px] text-error">*</span>
            </label>
            <input
              {...getInputProps(fields.name, { type: "text" })}
              placeholder="Enter space name"
              className={inputClasses}
            />
            {fields.name.errors && (
              <div className="mt-xs text-xs text-error">
                {fields.name.errors}
              </div>
            )}
          </div>

          {/* Private checkbox */}
          <div className="mb-lg">
            {isGuest ? (
              <>
                <input type="hidden" name="isPrivate" value="on" />
                <label className="flex items-center gap-sm text-sm text-neutral-500">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className="pointer-events-none"
                  />
                  Private space
                </label>
                <p className="mt-xs text-xs text-neutral-500">
                  Guest spaces are always private.
                </p>
              </>
            ) : (
              <label className="flex items-center gap-sm text-sm text-neutral-700">
                <input
                  {...getInputProps(fields.isPrivate, { type: "checkbox" })}
                />
                Private space
              </label>
            )}
          </div>

          {/* Multi-thread checkbox */}
          <div className="mb-lg">
            <label className="flex items-center gap-sm text-sm text-neutral-700">
              <input
                {...getInputProps(fields.useMultiThread, { type: "checkbox" })}
              />
              Enable multi-thread
            </label>
          </div>

          {/* Fixed member checkbox */}
          <div>
            <label className="flex items-center gap-sm text-sm text-neutral-700">
              <input
                {...getInputProps(fields.fixedMember, { type: "checkbox" })}
              />
              Fixed member
            </label>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-sm">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-[36px] items-center gap-xs rounded-sm border border-primary bg-primary px-lg font-body text-base font-[var(--weight-medium)] text-on-primary transition-all duration-[var(--transition-default)] hover:border-primary-dark hover:bg-primary-dark disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create"}
          </button>
          <Link
            to="/portal"
            className="inline-flex h-[36px] items-center gap-xs rounded-sm border border-neutral-300 bg-bg-card px-lg font-body text-base font-[var(--weight-medium)] text-neutral-700 no-underline transition-all duration-[var(--transition-default)] hover:border-neutral-400 hover:bg-neutral-100"
          >
            Cancel
          </Link>
        </div>
      </fetcher.Form>
    </div>
  );
}
