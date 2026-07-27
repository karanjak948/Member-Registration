import { Permission } from "@/constants/permissions";

export interface NavigationItem {
  id: string;

  title: string;

  href?: string;

  icon?: React.ReactNode;

  permission?: Permission;

  permissions?: Permission[];

  requireAll?: boolean;

  children?: NavigationItem[];
}