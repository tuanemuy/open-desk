import type { Route } from "./+types/index";

type UserProfile = {
  id: string;
  name: string;
  initial: string;
  email: string;
  isSelf: boolean;
};

export type PeopleLoaderData = {
  users: UserProfile[];
};

export async function loader(
  _args: Route.LoaderArgs,
): Promise<PeopleLoaderData> {
  const users: UserProfile[] = [
    {
      id: "1",
      name: "大田部 晃",
      initial: "大",
      email: "otabe.akira@example.com",
      isSelf: true,
    },
    {
      id: "2",
      name: "田中 太郎",
      initial: "田",
      email: "tanaka.taro@example.com",
      isSelf: false,
    },
    {
      id: "3",
      name: "佐藤 花子",
      initial: "佐",
      email: "sato.hanako@example.com",
      isSelf: false,
    },
    {
      id: "4",
      name: "鈴木 一郎",
      initial: "鈴",
      email: "suzuki.ichiro@example.com",
      isSelf: false,
    },
  ];

  return { users };
}
