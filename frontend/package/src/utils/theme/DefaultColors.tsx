import { createTheme } from "@mui/material/styles";
import { Arimo } from "next/font/google";

export const arimo = Arimo({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  fallback: ["Helvetica", "Arial", "sans-serif"],
});

const baselightTheme = createTheme({
  direction: "ltr",
  palette: {
    primary: {
      main: "#5D87FF",
      light: "#ECF2FF",
      dark: "#4570EA",
    },
    secondary: {
      main: "#49BEFF",
      light: "#E8F7FF",
      dark: "#23afdb",
    },
    success: {
      main: "#13DEB9",
      light: "#E6FFFA",
      dark: "#02b3a9",
      contrastText: "#ffffff",
    },
    info: {
      main: "#539BFF",
      light: "#EBF3FE",
      dark: "#1682d4",
      contrastText: "#ffffff",
    },
    error: {
      main: "#FA896B",
      light: "#FDEDE8",
      dark: "#f3704d",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#FFAE1F",
      light: "#FEF5E5",
      dark: "#ae8e59",
      contrastText: "#ffffff",
    },
    grey: {
      100: "#F2F6FA",
      200: "#EAEFF4",
      300: "#DFE5EF",
      400: "#7C8FAC",
      500: "#5A6A85",
      600: "#2A3547",
    },
    text: {
      primary: "#2A3547",
      secondary: "#5A6A85",
    },
    action: {
      disabledBackground: "rgba(73,82,88,0.12)",
      hoverOpacity: 0.02,
      hover: "#f6f9fc",
    },
    divider: "#e5eaef",
  },
  typography: {
    fontFamily: arimo.style.fontFamily,
    h1: {
      fontWeight: 700,
      fontSize: "2.25rem",
      lineHeight: "2.75rem",
      fontFamily: arimo.style.fontFamily,
    },
    h2: {
      fontWeight: 700,
      fontSize: "1.875rem",
      lineHeight: "2.25rem",
      fontFamily: arimo.style.fontFamily,
    },
    h3: {
      fontWeight: 700,
      fontSize: "1.5rem",
      lineHeight: "1.75rem",
      fontFamily: arimo.style.fontFamily,
    },
    h4: {
      fontWeight: 700,
      fontSize: "1.3125rem",
      lineHeight: "1.6rem",
      fontFamily: arimo.style.fontFamily,
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.125rem",
      lineHeight: "1.6rem",
      fontFamily: arimo.style.fontFamily,
    },
    h6: {
      fontWeight: 600,
      fontSize: "1rem",
      lineHeight: "1.2rem",
      fontFamily: arimo.style.fontFamily,
    },
    button: {
      textTransform: "capitalize",
      fontWeight: 600,
      fontFamily: arimo.style.fontFamily,
    },
    body1: {
      fontSize: "0.875rem",
      fontWeight: 400,
      lineHeight: "1.334rem",
      fontFamily: arimo.style.fontFamily,
    },
    body2: {
      fontSize: "0.75rem",
      letterSpacing: "0rem",
      fontWeight: 400,
      lineHeight: "1rem",
      fontFamily: arimo.style.fontFamily,
    },
    subtitle1: {
      fontSize: "0.875rem",
      fontWeight: 500,
      fontFamily: arimo.style.fontFamily,
    },
    subtitle2: {
      fontSize: "0.875rem",
      fontWeight: 600,
      fontFamily: arimo.style.fontFamily,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ".MuiPaper-elevation9, .MuiPopover-root .MuiPaper-elevation": {
          boxShadow:
            "rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px !important",
        },

      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "7px",
        },
      },
    },


  },
});

export { baselightTheme };
