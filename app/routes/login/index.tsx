import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { Link } from "react-router";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import { handlers } from "./action";

export { action } from "./action";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Login - OpenDesk" }];
}

export default function LoginPage(_props: Route.ComponentProps) {
  const fetcher = useCompositeAction<typeof handlers>();

  const [form, fields] = useForm({
    id: "login-form",
    lastResult: fetcher.data?.intent === "login" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.login.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.login.schema });
    },
  });

  const isPending = fetcher.isPending("login");

  const globalError =
    fetcher.data?.intent === "login" &&
    fetcher.data?.status === "error" &&
    fetcher.data?.error?.[""]?.[0];

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page">
      <div className="w-full max-w-[400px] px-xl">
        <div className="flex flex-col items-center rounded-lg border border-neutral-200 bg-bg-card px-xl py-2xl">
          {/* Logo */}
          <div className="mb-2xl font-heading text-2xl font-[var(--weight-normal)] tracking-tight text-neutral-800 select-none">
            Open
            <strong className="font-[var(--weight-semibold)] text-primary">
              Desk
            </strong>
          </div>

          {/* Global error */}
          {globalError ? (
            <div className="mb-md w-full rounded-md border border-error-light bg-error-light px-md py-sm text-sm text-error">
              {globalError}
            </div>
          ) : null}

          {/* Form */}
          <fetcher.Form
            method="post"
            className="flex w-full flex-col gap-md"
            {...getFormProps(form)}
          >
            <input type="hidden" name="intent" value="login" />

            {/* Email field */}
            <div className="flex flex-col gap-xs">
              <label
                htmlFor={fields.loginName.id}
                className="text-sm font-[var(--weight-medium)] text-neutral-700"
              >
                Email
              </label>
              <input
                {...getInputProps(fields.loginName, { type: "email" })}
                placeholder="name@example.com"
                autoComplete="email"
                className="h-10 w-full rounded-md border border-neutral-300 bg-bg-card px-md font-body text-base text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 hover:border-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
              />
              {fields.loginName.errors ? (
                <p className="text-xs text-error">
                  {fields.loginName.errors[0]}
                </p>
              ) : null}
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-xs">
              <label
                htmlFor={fields.password.id}
                className="text-sm font-[var(--weight-medium)] text-neutral-700"
              >
                Password
              </label>
              <input
                {...getInputProps(fields.password, { type: "password" })}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="h-10 w-full rounded-md border border-neutral-300 bg-bg-card px-md font-body text-base text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 hover:border-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
              />
              {fields.password.errors ? (
                <p className="text-xs text-error">
                  {fields.password.errors[0]}
                </p>
              ) : null}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isPending}
              className="mt-sm h-[42px] w-full rounded-md border-none bg-primary font-body text-base font-[var(--weight-medium)] text-on-primary transition-[background-color,box-shadow] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:bg-primary-darker disabled:opacity-60"
            >
              {isPending ? "Logging in..." : "Login"}
            </button>
          </fetcher.Form>

          {/* Help links */}
          <div className="mt-lg flex flex-col items-center gap-sm">
            <Link
              to="/login"
              className="text-sm text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
