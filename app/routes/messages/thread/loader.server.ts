import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import { listMessages } from "@/core/application/message/listMessages";
import type { UserId } from "@/core/domain/identity/valueObject";
import { MessageThread } from "@/core/domain/message/entity";
import { MessageThreadId } from "@/core/domain/message/valueObject";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type MessageEntry = {
  id: string;
  senderName: string;
  senderInitial: string;
  isSelf: boolean;
  time: string;
  body: string[];
};

type Recipient = {
  id: string;
  name: string;
  initial: string;
};

export type MessageThreadLoaderData = {
  recipient: Recipient;
  messages: MessageEntry[];
};

function formatMessageTime(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}年${m}月${d}日 ${hh}:${mm}`;
}

export async function loader({
  request,
  params,
}: Route.LoaderArgs): Promise<MessageThreadLoaderData> {
  const auth = await requireAuth(request, container);
  const threadId = params.threadId;

  // Fetch the thread to identify the counterpart
  const thread = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.messageThreadRepository.findById(
      MessageThreadId.create(threadId),
    );
  });

  if (!thread) {
    throw data({ message: "スレッドが見つかりません" }, { status: 404 });
  }

  if (!MessageThread.isParticipant(thread, auth.userId)) {
    throw data(
      { message: "このスレッドへのアクセス権がありません" },
      { status: 403 },
    );
  }

  const counterpartId = MessageThread.getCounterpartId(thread, auth.userId);

  // Fetch the counterpart user
  const counterpartUser = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.userRepository.findById(counterpartId);
    },
  );

  const recipientName = counterpartUser
    ? (counterpartUser.displayName as string)
    : "不明なユーザー";

  const recipient: Recipient = {
    id: counterpartId as string,
    name: recipientName,
    initial: recipientName.charAt(0),
  };

  // Fetch messages
  const messagesResult = await handleUseCase(() =>
    listMessages({
      container,
      headers: request.headers,
      input: {
        operatorId: auth.userId,
        threadId,
        offset: 0,
        limit: 100,
      },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  // Build a userId -> displayName map for senders
  const senderIds = new Set<string>();
  for (const msg of messagesResult.messages) {
    senderIds.add(msg.senderId);
  }

  const senderNameMap = new Map<string, string>();
  senderNameMap.set(auth.userId as string, auth.displayName as string);
  if (counterpartUser) {
    senderNameMap.set(
      counterpartId as string,
      counterpartUser.displayName as string,
    );
  }

  // Resolve any other senders not yet in the map (unlikely in 1-on-1 but safe)
  const unresolvedIds = [...senderIds].filter((id) => !senderNameMap.has(id));
  if (unresolvedIds.length > 0) {
    await container.unitOfWorkProvider.transaction(async (ctx) => {
      for (const id of unresolvedIds) {
        const user = await ctx.userRepository.findById(id as UserId);
        senderNameMap.set(id, user ? (user.displayName as string) : "不明");
      }
    });
  }

  const messages: MessageEntry[] = messagesResult.messages.map((msg) => {
    const isSelf = msg.senderId === (auth.userId as string);
    const senderName = isSelf
      ? "自分"
      : (senderNameMap.get(msg.senderId) ?? "不明");
    const senderDisplayName = senderNameMap.get(msg.senderId) ?? "不明";

    return {
      id: msg.messageId,
      senderName,
      senderInitial: senderDisplayName.charAt(0),
      isSelf,
      time: formatMessageTime(msg.createdAt),
      body: [msg.content],
    };
  });

  return { recipient, messages };
}
