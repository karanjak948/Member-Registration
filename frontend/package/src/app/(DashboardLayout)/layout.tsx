"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { styled, Container, Box, CircularProgress } from "@mui/material";

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

export default function RootLayout({ children }: Props) {
  const router = useRouter();
  const { status } = useSession();

  const [isSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
      <Box className="no-print">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onSidebarClose={() => setMobileSidebarOpen(false)}
        />
      </Box>

      <PageWrapper className="page-wrapper">
        <Box className="no-print">
          <Header toggleMobileSidebar={() => setMobileSidebarOpen(true)} />
        </Box>

        <Container
          maxWidth={false}
          className="content-container"
          sx={{
            pt: 2,
            px: { xs: 1.5, sm: 2.5, md: 3.5 },
          }}
        >
          <Box
            sx={{
              minHeight: "calc(100vh - 170px)",
            }}
          >
            {children}
          </Box>
        </Container>
      </PageWrapper>

      <style jsx global>{`
        @media print {
          .no-print,
          aside,
          header,
          .MuiDrawer-root {
            display: none !important;
          }
          .mainwrapper,
          .page-wrapper {
            display: block !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .content-container,
          .MuiContainer-root {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </MainWrapper>
  );
}
