import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { Link2, Trash2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { CustomFile } from "@/core/domain/system-settings/valueObject";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";

import type { handlers } from "./action.server";
import { customizeSchema } from "./schemas";

export { action } from "./action.server";
export { loader } from "./loader.server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "JavaScript/CSSでカスタマイズ - OpenDeskシステム管理" }];
}

type SectionId = "pc-js" | "sp-js" | "pc-css" | "sp-css";

const FILE_SECTIONS: {
  id: SectionId;
  label: string;
  stateKey: "pcJsFiles" | "mobileJsFiles" | "pcCssFiles" | "mobileCssFiles";
}[] = [
  { id: "pc-js", label: "PC用のJavaScriptファイル", stateKey: "pcJsFiles" },
  {
    id: "sp-js",
    label: "スマートフォン用のJavaScriptファイル",
    stateKey: "mobileJsFiles",
  },
  { id: "pc-css", label: "PC用のCSSファイル", stateKey: "pcCssFiles" },
  {
    id: "sp-css",
    label: "スマートフォン用のCSSファイル",
    stateKey: "mobileCssFiles",
  },
];

type FileLists = {
  pcJsFiles: CustomFile[];
  mobileJsFiles: CustomFile[];
  pcCssFiles: CustomFile[];
  mobileCssFiles: CustomFile[];
};

export default function CustomizePage({ loaderData }: Route.ComponentProps) {
  const { scope: initialScope } = loaderData;
  const [scope, setScope] = useState(initialScope);

  const [fileLists, setFileLists] = useState<FileLists>({
    pcJsFiles: [...loaderData.pcJsFiles],
    mobileJsFiles: [...loaderData.mobileJsFiles],
    pcCssFiles: [...loaderData.pcCssFiles],
    mobileCssFiles: [...loaderData.mobileCssFiles],
  });

  const [addDialogSection, setAddDialogSection] = useState<SectionId | null>(
    null,
  );

  const fetcher = useCompositeAction<typeof handlers>();

  const [form] = useForm({
    id: "customize-form",
    lastResult:
      fetcher.data?.intent === "updateCustomize" ? fetcher.data : undefined,
    constraint: getZodConstraint(customizeSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: customizeSchema });
    },
  });

  fetcher.register("updateCustomize", {
    onSuccess: () => toast.success("設定を保存しました"),
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "保存に失敗しました"),
  });

  const isPending = fetcher.isPending("updateCustomize");

  const handleAddFile = useCallback(
    (sectionId: SectionId, file: CustomFile) => {
      const section = FILE_SECTIONS.find((s) => s.id === sectionId);
      if (!section) return;
      setFileLists((prev) => ({
        ...prev,
        [section.stateKey]: [...prev[section.stateKey], file],
      }));
      setAddDialogSection(null);
    },
    [],
  );

  const handleDeleteFile = useCallback(
    (stateKey: keyof FileLists, index: number) => {
      setFileLists((prev) => ({
        ...prev,
        [stateKey]: prev[stateKey].filter((_, i) => i !== index),
      }));
    },
    [],
  );

  const handleCancel = useCallback(() => {
    setScope(initialScope);
    setFileLists({
      pcJsFiles: [...loaderData.pcJsFiles],
      mobileJsFiles: [...loaderData.mobileJsFiles],
      pcCssFiles: [...loaderData.pcCssFiles],
      mobileCssFiles: [...loaderData.mobileCssFiles],
    });
  }, [initialScope, loaderData]);

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        JavaScript/CSSでカスタマイズ
      </h2>

      <fetcher.Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="updateCustomize" />
        <input
          type="hidden"
          name="pcJsFiles"
          value={JSON.stringify(fileLists.pcJsFiles)}
        />
        <input
          type="hidden"
          name="mobileJsFiles"
          value={JSON.stringify(fileLists.mobileJsFiles)}
        />
        <input
          type="hidden"
          name="pcCssFiles"
          value={JSON.stringify(fileLists.pcCssFiles)}
        />
        <input
          type="hidden"
          name="mobileCssFiles"
          value={JSON.stringify(fileLists.mobileCssFiles)}
        />

        <div className="mb-lg rounded-lg border border-neutral-200 bg-bg-card p-lg">
          <div className="mb-lg">
            <div className="mb-md text-sm font-[var(--weight-medium)] text-neutral-600">
              適用範囲
            </div>
            <div className="flex flex-col gap-sm">
              {[
                { value: "all" as const, label: "すべてのユーザー" },
                {
                  value: "admin" as const,
                  label: "OpenDeskシステム管理者だけ",
                },
                { value: "none" as const, label: "適用しない" },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-sm">
                  <input
                    type="radio"
                    name="scope"
                    value={option.value}
                    checked={scope === option.value}
                    onChange={() => setScope(option.value)}
                    className="h-4 w-4 cursor-pointer accent-primary"
                  />
                  <span className="cursor-pointer text-base text-neutral-800 select-none">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {FILE_SECTIONS.map((section) => (
            <div key={section.id} className="mb-lg last:mb-0">
              <div className="mb-sm text-sm font-[var(--weight-medium)] text-neutral-600">
                {section.label}
              </div>

              {fileLists[section.stateKey].length > 0 && (
                <div className="mb-sm rounded-md border border-neutral-200">
                  {fileLists[section.stateKey].map((file, index) => (
                    <div
                      key={`${section.id}-${file.url}-${index}`}
                      className="flex items-center gap-sm border-b border-neutral-200 px-md py-sm last:border-b-0"
                    >
                      <Link2 className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                      <span
                        className="min-w-0 flex-1 truncate text-sm text-neutral-700"
                        title={file.url}
                      >
                        {file.url}
                      </span>
                      <span className="shrink-0 text-xs text-neutral-400">
                        {file.type === "URL" ? "URL" : "アップロード"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteFile(section.stateKey, index)
                        }
                        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-sm border-none bg-transparent text-neutral-400 transition-[color,background-color] duration-[var(--transition-default)] hover:bg-error-light hover:text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        aria-label="削除"
                        title="削除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-md">
                <button
                  type="button"
                  onClick={() => setAddDialogSection(section.id)}
                  className="inline-flex h-9 items-center gap-sm rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Upload className="h-3.5 w-3.5" />
                  URL指定またはアップロード
                </button>
                <span className="text-xs text-neutral-400">最大20MB</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-md">
          <button
            type="submit"
            disabled={isPending}
            className="h-9 rounded-md border-none bg-primary px-md font-body text-sm font-[var(--weight-medium)] text-on-primary transition-colors duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          >
            {isPending ? "保存中..." : "保存"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="h-9 rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            キャンセル
          </button>
        </div>
      </fetcher.Form>

      {addDialogSection !== null && (
        <AddFileDialog
          sectionId={addDialogSection}
          sectionLabel={
            FILE_SECTIONS.find((s) => s.id === addDialogSection)?.label ?? ""
          }
          onAdd={handleAddFile}
          onClose={() => setAddDialogSection(null)}
        />
      )}
    </section>
  );
}

/* ============================================================
 * Add File Dialog
 * ============================================================ */

type AddFileDialogProps = {
  sectionId: SectionId;
  sectionLabel: string;
  onAdd: (sectionId: SectionId, file: CustomFile) => void;
  onClose: () => void;
};

function AddFileDialog({
  sectionId,
  sectionLabel,
  onAdd,
  onClose,
}: AddFileDialogProps) {
  const [mode, setMode] = useState<"url" | "upload">("url");
  const [urlValue, setUrlValue] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);

    if (mode === "url") {
      const trimmed = urlValue.trim();
      if (!trimmed) {
        setUrlError("URLを入力してください");
        return;
      }
      try {
        new URL(trimmed);
      } catch {
        setUrlError("有効なURLを入力してください");
        return;
      }
      onAdd(sectionId, { type: "URL", url: trimmed, fileId: null });
    } else {
      if (!uploadFile) {
        setUrlError("ファイルを選択してください");
        return;
      }
      // For uploaded files, use the file name as a display URL placeholder.
      // In a production environment, the file would be uploaded to a server
      // and the returned URL would be used. Here we use a local object URL
      // as a reference and the file name for display.
      const fileUrl = uploadFile.name;
      onAdd(sectionId, { type: "UPLOAD", url: fileUrl, fileId: null });
    }
  };

  return (
    <div className="fixed inset-0 z-400 flex items-center justify-center">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop overlay for dismissing modal */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape key handled by parent dialog */}
      <div className="absolute inset-0 bg-neutral-900/20" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-label={`${sectionLabel} - ファイル追加`}
        aria-modal="true"
        className="relative z-10 w-[480px] rounded-xl border border-neutral-200 bg-bg-card p-lg shadow-lg"
      >
        <div className="mb-lg flex items-center justify-between">
          <h3 className="font-heading text-lg font-[var(--weight-semibold)] text-neutral-900">
            ファイルを追加
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-[28px] w-[28px] items-center justify-center rounded-md border-none bg-transparent text-neutral-400 transition-[color,background-color] duration-[var(--transition-default)] hover:bg-neutral-100 hover:text-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-md text-sm text-neutral-500">{sectionLabel}</p>

        <div className="mb-lg flex gap-sm" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "url"}
            onClick={() => {
              setMode("url");
              setUrlError(null);
            }}
            className={`flex-1 rounded-md border px-md py-sm text-center font-body text-sm font-[var(--weight-medium)] transition-[color,border-color,background-color] duration-[var(--transition-default)] ${
              mode === "url"
                ? "border-primary bg-primary-lighter text-primary"
                : "border-neutral-200 bg-bg-card text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
            }`}
          >
            URL指定
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "upload"}
            onClick={() => {
              setMode("upload");
              setUrlError(null);
            }}
            className={`flex-1 rounded-md border px-md py-sm text-center font-body text-sm font-[var(--weight-medium)] transition-[color,border-color,background-color] duration-[var(--transition-default)] ${
              mode === "upload"
                ? "border-primary bg-primary-lighter text-primary"
                : "border-neutral-200 bg-bg-card text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
            }`}
          >
            ファイルアップロード
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "url" ? (
            <div className="mb-lg">
              <label
                htmlFor="file-url"
                className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
              >
                URL
              </label>
              <input
                id="file-url"
                type="text"
                value={urlValue}
                onChange={(e) => {
                  setUrlValue(e.target.value);
                  setUrlError(null);
                }}
                placeholder="https://example.com/script.js"
                className="h-[34px] w-full rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
              />
              {urlError && (
                <p className="mt-xs text-xs text-error">{urlError}</p>
              )}
            </div>
          ) : (
            <div className="mb-lg">
              <label
                htmlFor="file-upload"
                className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
              >
                ファイル
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".js,.css"
                onChange={(e) => {
                  setUploadFile(e.target.files?.[0] ?? null);
                  setUrlError(null);
                }}
                className="text-sm text-neutral-600 file:mr-md file:h-[34px] file:cursor-pointer file:rounded-md file:border file:border-neutral-200 file:bg-bg-card file:px-lg file:font-body file:text-sm file:font-[var(--weight-medium)] file:text-neutral-700 file:transition-[border-color,background-color] file:duration-[var(--transition-default)] hover:file:border-neutral-300 hover:file:bg-neutral-50"
              />
              <p className="mt-xs text-xs text-neutral-400">最大20MB</p>
              {urlError && (
                <p className="mt-xs text-xs text-error">{urlError}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-sm">
            <button
              type="button"
              className="inline-flex h-[34px] items-center rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={onClose}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="inline-flex h-[34px] items-center rounded-md border border-primary bg-primary px-md font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
