import type { Route } from "./+types/index";

type RecordItem = {
  id: string;
  recordNo: number;
  company: string;
  department: string;
  person: string;
  address: string;
};

type ViewOption = {
  id: string;
  name: string;
};

type AppInfo = {
  id: string;
  name: string;
  spaceName: string;
  spaceId: string;
};

export type AppDetailLoaderData = {
  app: AppInfo;
  records: RecordItem[];
  views: ViewOption[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
};

export async function loader({
  params,
}: Route.LoaderArgs): Promise<AppDetailLoaderData> {
  const appId = params.appId;

  const app: AppInfo = {
    id: appId,
    name: "Customer List",
    spaceName: "Your Team Communication Space",
    spaceId: "1",
  };

  const records: RecordItem[] = [
    {
      id: "1",
      recordNo: 1,
      company: "Yamada Trading Co., Ltd.",
      department: "Sales",
      person: "Taro Tanaka",
      address: "1-1-1 Marunouchi, Chiyoda-ku, Tokyo",
    },
    {
      id: "2",
      recordNo: 2,
      company: "Tokyo Electronics Co., Ltd.",
      department: "Engineering",
      person: "Ichiro Suzuki",
      address: "3-2-1 Roppongi, Minato-ku, Tokyo",
    },
    {
      id: "3",
      recordNo: 3,
      company: "Kansai Goods Co., Ltd.",
      department: "General Affairs",
      person: "Hanako Sato",
      address: "2-5-10 Umeda, Kita-ku, Osaka",
    },
    {
      id: "4",
      recordNo: 4,
      company: "Chuo Construction Co., Ltd.",
      department: "Administration",
      person: "Kenji Takahashi",
      address: "4-8-15 Sakae, Naka-ku, Nagoya, Aichi",
    },
    {
      id: "5",
      recordNo: 5,
      company: "Kyushu Foods Co., Ltd.",
      department: "Sales Planning",
      person: "Misaki Watanabe",
      address: "1-3-7 Hakata Ekimae, Hakata-ku, Fukuoka",
    },
    {
      id: "6",
      recordNo: 6,
      company: "Hokkaido Transport Co., Ltd.",
      department: "Logistics",
      person: "Daisuke Ito",
      address: "Kita-1-Nishi-5-2, Chuo-ku, Sapporo, Hokkaido",
    },
    {
      id: "7",
      recordNo: 7,
      company: "Yokohama Precision Co., Ltd.",
      department: "Manufacturing",
      person: "Kazuya Kobayashi",
      address: "2-1-1 Minatomirai, Nishi-ku, Yokohama, Kanagawa",
    },
    {
      id: "8",
      recordNo: 8,
      company: "West Japan Telecom Co., Ltd.",
      department: "IT Systems",
      person: "Yuko Yamamoto",
      address: "1-6-3 Kamiyacho, Naka-ku, Hiroshima",
    },
    {
      id: "9",
      recordNo: 9,
      company: "Sendai Chemical Co., Ltd.",
      department: "R&D",
      person: "Makoto Nakamura",
      address: "3-7-1 Ichibancho, Aoba-ku, Sendai, Miyagi",
    },
    {
      id: "10",
      recordNo: 10,
      company: "Shikoku Trading Co., Ltd.",
      department: "Accounting",
      person: "Eri Matsuda",
      address: "8-12 Marugamemachi, Takamatsu, Kagawa",
    },
  ];

  const views: ViewOption[] = [
    { id: "1", name: "Customer List" },
    { id: "2", name: "Customer Rank A" },
    { id: "3", name: "(All)" },
  ];

  return {
    app,
    records,
    views,
    totalCount: 24,
    currentPage: 1,
    pageSize: 10,
  };
}
