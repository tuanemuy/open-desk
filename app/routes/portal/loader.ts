import type { Route } from "./+types/index";

type NotificationItem = {
  id: string;
  appName: string;
  message: string;
  timeAgo: string;
  author: string;
  unread: boolean;
};

type SpaceItem = {
  id: string;
  name: string;
  initial: string;
  color: string;
  description: string;
};

type AppItem = {
  id: string;
  name: string;
  spaceName: string;
  icon: "file" | "people" | "calendar";
};

type Announcement = {
  title: string;
  bodyHtml: string;
  author: string;
  date: string;
};

export type PortalLoaderData = {
  announcement: Announcement;
  notifications: NotificationItem[];
  spaces: SpaceItem[];
  apps: AppItem[];
};

export async function loader(
  _args: Route.LoaderArgs,
): Promise<PortalLoaderData> {
  // Static data for the portal page.
  // Will be replaced with real data fetching when backend is wired up.
  const announcement: Announcement = {
    title: "Welcome to OpenDesk",
    bodyHtml: [
      "<p>OpenDesk is a cloud platform that centralizes your team's information and streamlines operations. Follow the steps below to create your first app.</p>",
      '<div class="announcement-image-placeholder">App creation steps screenshot</div>',
      "<ol>",
      '<li>Select "Create App" from the "Options" button at the top of the screen.</li>',
      '<li>Choose a template or build a custom app from scratch with "Create from Scratch".</li>',
      "<li>Drag and drop fields to configure your form layout.</li>",
      '<li>Click "Publish" to make the app available to your team members.</li>',
      "</ol>",
      '<p>For detailed instructions, visit the <a href="#">Help Center</a>. If you have questions, feel free to ask in the <a href="#">Support Channel</a>.</p>',
    ].join(""),
    author: "Taro Yamada",
    date: "2026/4/1 9:30",
  };

  const notifications: NotificationItem[] = [
    {
      id: "1",
      appName: "Customer List",
      message: "Hanako Suzuki commented on a record",
      timeAgo: "10 min ago",
      author: "Hanako Suzuki",
      unread: true,
    },
    {
      id: "2",
      appName: "Project Management",
      message: 'Task "Create API design doc" completed',
      timeAgo: "30 min ago",
      author: "Ichiro Sato",
      unread: true,
    },
    {
      id: "3",
      appName: "File Management",
      message: '"2026 Budget.xlsx" was uploaded',
      timeAgo: "1 hour ago",
      author: "Misaki Tanaka",
      unread: true,
    },
    {
      id: "4",
      appName: "Attendance",
      message: "This month's attendance was approved",
      timeAgo: "3 hours ago",
      author: "Kenta Takahashi",
      unread: false,
    },
  ];

  const spaces: SpaceItem[] = [
    {
      id: "1",
      name: "Development Team",
      initial: "D",
      color: "var(--color-primary)",
      description: "Product development information sharing space",
    },
    {
      id: "2",
      name: "Sales",
      initial: "S",
      color: "var(--color-success)",
      description: "Sales activity management and information sharing",
    },
    {
      id: "3",
      name: "General Affairs",
      initial: "G",
      color: "var(--color-warning)",
      description: "Internal policies and procedures space",
    },
  ];

  const apps: AppItem[] = [
    {
      id: "1",
      name: "File Management",
      spaceName: "Development Team",
      icon: "file",
    },
    { id: "2", name: "Customer List", spaceName: "Sales", icon: "people" },
    {
      id: "3",
      name: "Attendance",
      spaceName: "General Affairs",
      icon: "calendar",
    },
  ];

  return {
    announcement,
    notifications,
    spaces,
    apps,
  };
}
