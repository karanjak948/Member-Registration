"use client";

import type { ReactNode } from "react";

import { Provider as ReduxProvider } from "react-redux";
import { SessionProvider } from "next-auth/react";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";

import { store } from "@/store";
import { baselightTheme } from "@/utils/theme/DefaultColors";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({
  children,
}: ProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <SessionProvider>
        <ThemeProvider theme={baselightTheme}>
          <CssBaseline />

          {children}
        </ThemeProvider>
      </SessionProvider>
    </ReduxProvider>
  );
}