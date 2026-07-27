import React from "react";
import { Box, Typography } from "@mui/material";
import {
  Logo,
  Sidebar as MUI_Sidebar,
  Menu,
  MenuItem,
  Submenu,
} from "react-mui-sidebar";
import { IconPoint } from '@tabler/icons-react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upgrade } from "./Updrade";
import { getMenuItems, MenuItem as MenuItemType } from "./MenuItems";
import { usePermissions } from "@/hooks/usePermissions";

// ============================================================
// RENDER MENU ITEMS
// ============================================================

const renderMenuItems = (items: MenuItemType[], pathDirect: string) => {
  return items.map((item: MenuItemType) => {
    // Navigation Label
    if ("navlabel" in item && item.navlabel === true) {
      return (
        <Menu
          subHeading={item.subheader}
          key={item.subheader}
        />
      );
    }

    // Regular menu item with id
    if ("id" in item) {
      const Icon = item.icon ? item.icon : IconPoint;
      const itemIcon = <Icon stroke={1.5} size="1.3rem" />;

      // If the item has children (submenu)
      if (item.children && item.children.length > 0) {
        return (
          <Submenu
            key={item.id}
            title={item.title}
            icon={itemIcon}
            borderRadius='7px'
          >
            {renderMenuItems(item.children, pathDirect)}
          </Submenu>
        );
      }

      // If the item has no children, render a MenuItem
      return (
        <Box px={3} key={item.id}>
          <MenuItem
            key={item.id}
            isSelected={pathDirect === item?.href}
            borderRadius='8px'
            icon={itemIcon}
            link={item.href}
            component={Link}
          >
            {item.title}
          </MenuItem>
        </Box>
      );
    }

    return null;
  });
};

// ============================================================
// SIDEBAR ITEMS
// ============================================================

const SidebarItems = () => {
  const pathname = usePathname();
  const pathDirect = pathname;

  // Get permissions from session
  const { permissions } = usePermissions();

  // Build menu items dynamically based on permissions
  const menuItems = getMenuItems(permissions);

  return (
    <>
      <MUI_Sidebar
        width={"100%"}
        showProfile={false}
        themeColor={"#5D87FF"}
        themeSecondaryColor={'#49beff'}
      >
        <Logo
          img='/images/logos/dark-logo.svg'
          component={Link}
          to="/"
        >
          Modernize
        </Logo>

        {renderMenuItems(menuItems, pathDirect)}

        <Box px={2}>
          <Upgrade />
        </Box>
      </MUI_Sidebar>
    </>
  );
};

export default SidebarItems;