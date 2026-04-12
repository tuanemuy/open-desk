import { getFormProps, getTextareaProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import type { handlers } from "./action.server";
import { addCommentSchema } from "./schemas";

export { action } from "./action.server";
export { loader } from "./loader.server";

export function meta({ data }: Route.MetaArgs) {
  const appName = data?.app?.name ?? "App";
  return [{ title: `Record Detail - ${appName} - OpenDesk` }];
}

function MultiLineText({ value }: { value: string }) {
  const lines = value.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const key = `${line.slice(0, 20)}-${i}`;
        return (
          <span key={key}>
            {i > 0 && <br />}
            {line}
          </span>
        );
      })}
    </>
  );
}

export default function RecordDetailPage({ loaderData }: Route.ComponentProps) {
  const { app, rows, comments, histories } = loaderData;
  const [activeTab, setActiveTab] = useState<"comments" | "history">(
    "comments",
  );

  const fetcher = useCompositeAction<typeof handlers>();

  const [commentForm, commentFields] = useForm({
    id: "comment-form",
    lastResult:
      fetcher.data?.intent === "addComment" ? fetcher.data : undefined,
    constraint: getZodConstraint(addCommentSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: addCommentSchema });
    },
  });

  fetcher.register("addComment", {
    onSuccess: () => {
      commentForm.reset();
    },
  });

  const isPendingComment = fetcher.isPending("addComment");

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
          <li>Record Detail</li>
        </ol>
      </nav>

      {/* Toolbar */}
      <div className="mb-lg flex flex-wrap items-center gap-sm">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-neutral-300 bg-bg-card text-base text-neutral-700 transition-all duration-[var(--transition-default)] hover:border-neutral-400 hover:bg-neutral-100"
          aria-label="Previous record"
          title="Previous record"
        >
          <ArrowLeft size={16} />
        </button>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-neutral-300 bg-bg-card text-base text-neutral-700 transition-all duration-[var(--transition-default)] hover:border-neutral-400 hover:bg-neutral-100"
          aria-label="Next record"
          title="Next record"
        >
          <ArrowRight size={16} />
        </button>

        <div className="h-5 w-px shrink-0 bg-neutral-200" />

        <Link
          to={`/apps/${app.id}/records/new`}
          className="inline-flex h-[32px] items-center gap-xs rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] leading-tight text-neutral-700 no-underline transition-all duration-[var(--transition-default)] hover:border-neutral-400 hover:bg-neutral-100"
        >
          Add record
        </Link>
        <button
          type="button"
          className="inline-flex h-[32px] items-center gap-xs rounded-sm border border-primary bg-primary px-md font-body text-sm font-[var(--weight-medium)] leading-tight text-on-primary transition-all duration-[var(--transition-default)] hover:border-primary-dark hover:bg-primary-dark active:border-primary-darker active:bg-primary-darker"
        >
          Edit record
        </button>
        <button
          type="button"
          className="inline-flex h-[32px] items-center gap-xs rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] leading-tight text-neutral-700 transition-all duration-[var(--transition-default)] hover:border-neutral-400 hover:bg-neutral-100"
        >
          Reuse record
        </button>

        <div className="ml-auto flex items-center gap-sm">
          <Link
            to={`/apps/${app.id}/settings`}
            className="px-sm py-[6px] text-sm font-[var(--weight-medium)] text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
          >
            App settings
          </Link>
          <button
            type="button"
            className="inline-flex h-[32px] items-center gap-xs rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] leading-tight text-neutral-700 transition-all duration-[var(--transition-default)] hover:border-neutral-400 hover:bg-neutral-100"
          >
            Options
          </button>
        </div>
      </div>

      {/* Record Detail Card */}
      <div className="mb-lg rounded-md border border-neutral-200 bg-bg-card p-lg">
        {rows.map((row, rowIndex) => (
          <div
            key={row.id}
            className={`flex gap-lg py-md ${rowIndex === 0 ? "pt-0" : ""} ${rowIndex === rows.length - 1 ? "border-b-0 pb-0" : "border-b border-neutral-100"}`}
          >
            {row.fields.map((field, fieldIndex) => (
              <div
                key={field.label}
                className="min-w-0 flex-1"
                style={
                  row.flex?.[fieldIndex]
                    ? { flex: row.flex[fieldIndex] }
                    : undefined
                }
              >
                <div className="mb-xs text-sm font-[var(--weight-medium)] text-neutral-600">
                  {field.label}
                </div>
                <div className="break-words text-base leading-normal text-neutral-800">
                  {field.type === "email" ? (
                    <a
                      href={`mailto:${field.value}`}
                      className="text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
                    >
                      {field.value}
                    </a>
                  ) : field.type === "badge" ? (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-sm bg-primary-lighter text-sm font-[var(--weight-semibold)] text-primary-dark">
                      {field.value}
                    </span>
                  ) : field.type === "image" ? (
                    <div className="flex h-[100px] w-[150px] items-center justify-center rounded-sm border border-neutral-200 bg-neutral-100 text-sm text-neutral-400">
                      {field.value}
                    </div>
                  ) : (
                    <MultiLineText value={field.value} />
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Tabs Section */}
      <div className="overflow-hidden rounded-md border border-neutral-200 bg-bg-card">
        {/* Tabs Nav */}
        <div className="flex border-b border-neutral-200 bg-bg-card">
          <button
            type="button"
            className={`-mb-px border-b-2 px-lg py-sm font-body text-sm font-[var(--weight-medium)] transition-all duration-[var(--transition-default)] ${
              activeTab === "comments"
                ? "border-primary text-primary"
                : "border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
            }`}
            onClick={() => setActiveTab("comments")}
          >
            Comments
          </button>
          <button
            type="button"
            className={`-mb-px border-b-2 px-lg py-sm font-body text-sm font-[var(--weight-medium)] transition-all duration-[var(--transition-default)] ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
            }`}
            onClick={() => setActiveTab("history")}
          >
            Change History
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-lg">
          {activeTab === "comments" && (
            <>
              {/* Comments List */}
              <div className="flex flex-col gap-lg">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-md">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-[var(--weight-medium)] ${
                        comment.avatarColor === "blue"
                          ? "bg-primary-lighter text-primary-dark"
                          : "bg-success-light text-success"
                      }`}
                    >
                      {comment.initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-xs flex items-center gap-sm">
                        <span className="text-sm font-[var(--weight-medium)] text-neutral-800">
                          {comment.author}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {comment.time}
                        </span>
                      </div>
                      <div className="text-sm leading-relaxed text-neutral-700">
                        {comment.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment Form */}
              <div className="mt-lg flex gap-md border-t border-neutral-200 pt-lg">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-[var(--weight-medium)] text-primary-dark">
                  Y
                </div>
                <div className="flex-1">
                  <fetcher.Form method="post" {...getFormProps(commentForm)}>
                    <input type="hidden" name="intent" value="addComment" />
                    <textarea
                      {...getTextareaProps(commentFields.comment)}
                      placeholder="Write a comment..."
                      className="min-h-[80px] w-full resize-y rounded-sm border border-neutral-300 bg-bg-card px-md py-sm font-body text-sm leading-normal text-neutral-800 outline-none transition-[border-color] duration-[var(--transition-default)] placeholder:text-neutral-400 focus:border-primary"
                    />
                    {commentFields.comment.errors && (
                      <div className="mt-xs text-xs text-error">
                        {commentFields.comment.errors}
                      </div>
                    )}
                    <div className="mt-sm flex justify-end">
                      <button
                        type="submit"
                        disabled={isPendingComment}
                        className="inline-flex items-center gap-xs rounded-sm border border-primary bg-primary px-md py-[6px] font-body text-sm font-[var(--weight-medium)] leading-tight text-on-primary transition-all duration-[var(--transition-default)] hover:border-primary-dark hover:bg-primary-dark disabled:opacity-50"
                      >
                        {isPendingComment ? "Posting..." : "Post"}
                      </button>
                    </div>
                  </fetcher.Form>
                </div>
              </div>
            </>
          )}

          {activeTab === "history" &&
            (histories.length === 0 ? (
              <div className="py-lg text-center text-sm text-neutral-500">
                変更履歴がありません
              </div>
            ) : (
              <div className="flex flex-col gap-lg">
                {histories.map((entry) => (
                  <div
                    key={entry.id}
                    className="border-b border-neutral-100 pb-lg last:border-b-0 last:pb-0"
                  >
                    <div className="mb-sm flex items-center gap-sm">
                      <span className="text-sm font-[var(--weight-medium)] text-neutral-800">
                        {entry.modifier}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {entry.modifiedAt}
                      </span>
                      <span className="rounded-sm bg-neutral-100 px-xs py-[2px] text-xs text-neutral-500">
                        v{entry.version}
                      </span>
                    </div>
                    <div className="flex flex-col gap-xs">
                      {entry.changes.map((change) => (
                        <div
                          key={`${entry.id}-${change.fieldCode}`}
                          className="text-sm text-neutral-700"
                        >
                          <span className="font-[var(--weight-medium)] text-neutral-600">
                            {change.fieldCode}
                          </span>
                          :{" "}
                          <span className="text-neutral-400 line-through">
                            {change.oldValue || "(empty)"}
                          </span>
                          {" → "}
                          <span className="text-neutral-800">
                            {change.newValue || "(empty)"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
