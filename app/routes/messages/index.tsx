import { MessageSquare } from "lucide-react";
import type { Route } from "./+types/index";

export { loader } from "./loader";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "メッセージ - OpenDesk" }];
}

export default function MessagesPage(_props: Route.ComponentProps) {
  return (
    <div className="mx-auto max-w-[800px] px-xl">
      {/* Page Header */}
      <div className="border-b border-neutral-200 py-lg">
        <h2 className="font-heading text-xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
          メッセージ
        </h2>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center py-3xl">
        <div className="mb-lg flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <MessageSquare className="h-8 w-8 text-neutral-400" />
        </div>
        <p className="mb-sm text-lg font-[var(--weight-medium)] text-neutral-700">
          メッセージはまだありません
        </p>
        <p className="max-w-sm text-center text-sm leading-normal text-neutral-500">
          他のユーザーのピープルページから「個人メッセージ」を選択すると、メッセージのやりとりを開始できます。
        </p>
      </div>
    </div>
  );
}
