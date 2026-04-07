import type { Route } from "./+types/index";

export { loader } from "./loader";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "メッセージ - OpenDesk" }];
}

export default function MessagesPage(_props: Route.ComponentProps) {
  return (
    <div className="mx-auto max-w-[800px] px-xl py-lg">
      <p className="text-neutral-500">
        メッセージスレッドを読み込んでいます...
      </p>
    </div>
  );
}
