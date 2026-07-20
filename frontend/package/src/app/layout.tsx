"use client";

import "./global.css";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";

import { baselightTheme } from "@/utils/theme/DefaultColors";
import Providers from "./providers";

import StoreProvider from "@/store/provider";

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <Providers>
            <ThemeProvider theme={baselightTheme}>
              <CssBaseline />
              {children}
            </ThemeProvider>
          </Providers>
        </StoreProvider>
      </body>
    </html>
  );
}