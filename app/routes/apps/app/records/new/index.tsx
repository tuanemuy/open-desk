import {
  getFormProps,
  getInputProps,
  getSelectProps,
  getTextareaProps,
  useForm,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { Paperclip } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import { handlers } from "./action";

export { action } from "./action";
export { loader } from "./loader";

export function meta({ data }: Route.MetaArgs) {
  const appName = data?.app?.name ?? "App";
  return [{ title: `Add Record - ${appName} - OpenDesk` }];
}

export default function NewRecordPage({ loaderData }: Route.ComponentProps) {
  const { app, rankOptions } = loaderData;
  const navigate = useNavigate();

  const fetcher = useCompositeAction<typeof handlers>();

  const [form, fields] = useForm({
    id: "create-record-form",
    lastResult:
      fetcher.data?.intent === "createRecord" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.createRecord.schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.createRecord.schema });
    },
  });

  fetcher.register("createRecord", {
    onSuccess: (data) => {
      navigate(`/apps/${app.id}/records/${data.data.recordId}`);
    },
  });

  const isPending = fetcher.isPending("createRecord");

  const inputClasses =
    "w-full rounded-sm border border-neutral-300 bg-bg-card px-md py-sm font-body text-base leading-normal text-neutral-800 outline-none transition-[border-color] duration-[var(--transition-default)] placeholder:text-neutral-400 hover:not-focus:border-neutral-400 focus:border-primary";

  const selectClasses =
    "w-full appearance-none rounded-sm border border-neutral-300 bg-bg-card py-sm pr-[36px] pl-md font-body text-base text-neutral-800 outline-none transition-[border-color] duration-[var(--transition-default)] bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%2712%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%23666%27%20stroke-width=%272%27%3E%3Cpath%20d=%27M6%209l6%206%206-6%27/%3E%3C/svg%3E')] bg-[position:right_12px_center] bg-no-repeat cursor-pointer hover:not-focus:border-neutral-400 focus:border-primary";

  return (
    <div className="mx-auto max-w-[1400px] px-lg px-xl">
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
          <li>
            <Link
              to={`/spaces/${app.spaceId}`}
              className="text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
            >
              Space: {app.spaceName}
            </Link>
          </li>
          <li className="text-xs text-neutral-400">&gt;</li>
          <li>
            <Link
              to={`/apps/${app.id}`}
              className="text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
            >
              App: {app.name}
            </Link>
          </li>
          <li className="text-xs text-neutral-400">&gt;</li>
          <li>Add Record</li>
        </ol>
      </nav>

      <fetcher.Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="createRecord" />

        {/* Top Action Bar */}
        <div className="mb-lg flex items-center gap-sm">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-[36px] items-center gap-xs rounded-sm border border-primary bg-primary px-lg font-body text-base font-[var(--weight-medium)] text-on-primary transition-all duration-[var(--transition-default)] hover:border-primary-dark hover:bg-primary-dark disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
          <Link
            to={`/apps/${app.id}`}
            className="inline-flex h-[36px] items-center gap-xs rounded-sm border border-neutral-300 bg-bg-card px-lg font-body text-base font-[var(--weight-medium)] text-neutral-700 no-underline transition-all duration-[var(--transition-default)] hover:border-neutral-400 hover:bg-neutral-100"
          >
            Cancel
          </Link>
        </div>

        {/* Form Card */}
        <div className="mb-lg rounded-lg border border-neutral-200 bg-bg-card p-lg">
          {/* Row 1: Record Number */}
          <div className="mb-lg flex gap-lg">
            <div className="min-w-0 flex-1">
              <label className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600">
                Record No. <span className="ml-[2px] text-error">*</span>
                <input
                  type="text"
                  value="(Auto-generated)"
                  readOnly
                  tabIndex={-1}
                  className="mt-xs block w-full cursor-not-allowed rounded-sm border border-neutral-200 bg-bg-section px-md py-sm font-body text-base leading-normal font-[var(--weight-normal)] text-neutral-500 outline-none"
                />
              </label>
            </div>
          </div>

          {/* Row 2: Company / Department / Contact */}
          <div className="mb-lg flex gap-lg">
            <div className="min-w-0 flex-1">
              <label
                htmlFor={fields.company.id}
                className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
              >
                Company
              </label>
              <input
                {...getInputProps(fields.company, { type: "text" })}
                className={inputClasses}
              />
              {fields.company.errors && (
                <div className="mt-xs text-xs text-error">
                  {fields.company.errors}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <label
                htmlFor={fields.department.id}
                className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
              >
                Department
              </label>
              <input
                {...getInputProps(fields.department, { type: "text" })}
                className={inputClasses}
              />
              {fields.department.errors && (
                <div className="mt-xs text-xs text-error">
                  {fields.department.errors}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <label
                htmlFor={fields.person.id}
                className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
              >
                Contact
              </label>
              <input
                {...getInputProps(fields.person, { type: "text" })}
                className={inputClasses}
              />
              {fields.person.errors && (
                <div className="mt-xs text-xs text-error">
                  {fields.person.errors}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Postal Code / TEL / FAX */}
          <div className="mb-lg flex gap-lg">
            <div className="min-w-0 flex-1">
              <label
                htmlFor={fields.postalCode.id}
                className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
              >
                Postal Code (numbers only)
              </label>
              <input
                {...getInputProps(fields.postalCode, { type: "text" })}
                maxLength={7}
                inputMode="numeric"
                className={inputClasses}
              />
              <div className="mt-[2px] text-xs text-neutral-400">
                7 characters or less
              </div>
              {fields.postalCode.errors && (
                <div className="mt-xs text-xs text-error">
                  {fields.postalCode.errors}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <label
                htmlFor={fields.tel.id}
                className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
              >
                TEL (numbers only)
              </label>
              <input
                {...getInputProps(fields.tel, { type: "text" })}
                inputMode="numeric"
                className={inputClasses}
              />
              {fields.tel.errors && (
                <div className="mt-xs text-xs text-error">
                  {fields.tel.errors}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <label
                htmlFor={fields.fax.id}
                className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
              >
                FAX (numbers only)
              </label>
              <input
                {...getInputProps(fields.fax, { type: "text" })}
                inputMode="numeric"
                className={inputClasses}
              />
              {fields.fax.errors && (
                <div className="mt-xs text-xs text-error">
                  {fields.fax.errors}
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Address / Customer Rank */}
          <div className="mb-lg flex gap-lg">
            <div className="min-w-0" style={{ flex: 2 }}>
              <label
                htmlFor={fields.address.id}
                className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
              >
                Address
              </label>
              <input
                {...getInputProps(fields.address, { type: "text" })}
                className={inputClasses}
              />
              {fields.address.errors && (
                <div className="mt-xs text-xs text-error">
                  {fields.address.errors}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <label
                htmlFor={fields.rank.id}
                className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
              >
                Customer Rank
              </label>
              <select
                {...getSelectProps(fields.rank)}
                className={selectClasses}
              >
                {rankOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {fields.rank.errors && (
                <div className="mt-xs text-xs text-error">
                  {fields.rank.errors}
                </div>
              )}
            </div>
          </div>

          {/* Row 5: Email / Company Logo */}
          <div className="mb-lg flex gap-lg">
            <div className="min-w-0 flex-1">
              <label
                htmlFor={fields.email.id}
                className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
              >
                Email
              </label>
              <input
                {...getInputProps(fields.email, { type: "email" })}
                className={inputClasses}
              />
              {fields.email.errors && (
                <div className="mt-xs text-xs text-error">
                  {fields.email.errors}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600">
                Company Logo
              </span>
              <label className="relative block">
                <div className="cursor-pointer rounded-sm border border-dashed border-neutral-300 bg-bg-card px-md py-lg text-center transition-all duration-[var(--transition-default)] hover:border-primary hover:bg-primary-lighter">
                  <div className="mb-xs text-2xl text-neutral-400">
                    <Paperclip size={24} className="mx-auto" />
                  </div>
                  <div className="text-sm text-neutral-500">
                    <strong className="font-[var(--weight-medium)] text-primary">
                      Choose file
                    </strong>{" "}
                    or drag & drop
                  </div>
                  <div className="mt-xs text-xs text-neutral-400">Max 1GB</div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>
          </div>

          {/* Row 6: Notes */}
          <div className="flex gap-lg">
            <div className="min-w-0 flex-1">
              <label
                htmlFor={fields.notes.id}
                className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
              >
                Notes
              </label>
              <textarea
                {...getTextareaProps(fields.notes)}
                className="min-h-[120px] w-full resize-y rounded-sm border border-neutral-300 bg-bg-card px-md py-sm font-body text-base leading-normal text-neutral-800 outline-none transition-[border-color] duration-[var(--transition-default)] placeholder:text-neutral-400 hover:not-focus:border-neutral-400 focus:border-primary"
              />
              {fields.notes.errors && (
                <div className="mt-xs text-xs text-error">
                  {fields.notes.errors}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center gap-sm pt-md">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-[36px] items-center gap-xs rounded-sm border border-primary bg-primary px-lg font-body text-base font-[var(--weight-medium)] text-on-primary transition-all duration-[var(--transition-default)] hover:border-primary-dark hover:bg-primary-dark disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
          <Link
            to={`/apps/${app.id}`}
            className="inline-flex h-[36px] items-center gap-xs rounded-sm border border-neutral-300 bg-bg-card px-lg font-body text-base font-[var(--weight-medium)] text-neutral-700 no-underline transition-all duration-[var(--transition-default)] hover:border-neutral-400 hover:bg-neutral-100"
          >
            Cancel
          </Link>
        </div>
      </fetcher.Form>
    </div>
  );
}
