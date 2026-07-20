"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  styled,
  Container,
  Box,
  CircularProgress,
} from "@mui/material";

import Header from "@/app/(DashboardLayout)/layout/header/Header";
import Sidebar from "@/app/(DashboardLayout)/layout/sidebar/Sidebar";

const MainWrapper = styled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  width: "100%",
}));

const PageWrapper = styled("div")(() => ({
  display: "flex",
  flexGrow: 1,
  paddingBottom: "60px",
  flexDirection: "column",
  zIndex: 1,
  backgroundColor: "transparent",
}));

interface Props {
  children: React.ReactNode;
}

export default function RootLayout({
  children,
}: Props) {
  const router = useRouter();

  const { status } = useSession();

  const [isSidebarOpen] = useState(true);

  const [
    isMobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/authentication/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <MainWrapper className="mainwrapper">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onSidebarClose={() =>
          setMobileSidebarOpen(false)
        }
      />

      <PageWrapper className="page-wrapper">
        <Header
          toggleMobileSidebar={() =>
            setMobileSidebarOpen(true)
          }
        />

        <Container
          sx={{
            pt: 3,
            maxWidth: "1200px",
          }}
        >
          <Box
            sx={{
              minHeight:
                "calc(100vh - 170px)",
            }}
          >
            {children}
          </Box>
        </Container>
      </PageWrapper>
    </MainWrapper>
  );
}