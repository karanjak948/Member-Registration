import {
  IconLayoutDashboard,
  IconUserPlus,
  IconUsers,
  IconReportAnalytics,
  IconUser,
  IconSettings,
} from "@tabler/icons-react";

import { uniqueId } from "lodash";

const Menuitems = [
  {
    navlabel: true,
    subheader: "MAIN",
  },
  {
    id: uniqueId(),
    title: "Dashboard",
    icon: IconLayoutDashboard,
    href: "/dashboard",
  },

  {
    navlabel: true,
    subheader: "MEMBER MANAGEMENT",
  },
  {
    id: uniqueId(),
    title: "Members",
    icon: IconUsers,
    href: "/members",
  },
  {
    id: uniqueId(),
    title: "Register Member",
    icon: IconUserPlus,
    href: "/members/new",
  },

  {
    navlabel: true,
    subheader: "REPORTS",
  },
  {
    id: uniqueId(),
    title: "Reports",
    icon: IconReportAnalytics,
    href: "/reports",
  },

  {
    navlabel: true,
    subheader: "ACCOUNT",
  },
  {
    id: uniqueId(),
    title: "Profile",
    icon: IconUser,
    href: "/profile",
  },
  {
    id: uniqueId(),
    title: "Settings",
    icon: IconSettings,
    href: "/settings",
  },
];

export default Menuitems;