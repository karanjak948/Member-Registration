import React from "react";

import {
  AppBar,
  Badge,
  Box,
  IconButton,
  Stack,
  Toolbar,
  styled,
} from "@mui/material";

import { IconBellRinging, IconMenu } from "@tabler/icons-react";

import Profile from "./Profile";

interface ItemType {
  toggleMobileSidebar: (
    event: React.MouseEvent<HTMLElement>
  ) => void;
}

const AppBarStyled = styled(AppBar)(({ theme }) => ({
  boxShadow: "none",
  background: theme.palette.background.paper,
  justifyContent: "center",
  backdropFilter: "blur(4px)",

  [theme.breakpoints.up("lg")]: {
    minHeight: "70px",
  },
}));

const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
  width: "100%",
  color: theme.palette.text.secondary,
}));

const Header = ({
  toggleMobileSidebar,
}: ItemType) => {
  return (
    <AppBarStyled
      position="sticky"
      color="default"
    >
      <ToolbarStyled>
        <IconButton
          color="inherit"
          aria-label="menu"
          onClick={toggleMobileSidebar}
          sx={{
            display: {
              xs: "inline-flex",
              lg: "none",
            },
          }}
        >
          <IconMenu
            width={20}
            height={20}
          />
        </IconButton>

        <Box flexGrow={1} />

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
        >
          <IconButton
            size="large"
            color="inherit"
          >
            <Badge
              variant="dot"
              color="primary"
            >
              <IconBellRinging
                size={21}
                stroke={1.5}
              />
            </Badge>
          </IconButton>

          <Profile />
        </Stack>
      </ToolbarStyled>
    </AppBarStyled>
  );
};

export default Header;