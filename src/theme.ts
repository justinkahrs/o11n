import { createTheme } from "@mui/material/styles";
export const theme = createTheme({
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(","),
    caption: {
      fontSize: "0.67rem",
    },
  },
  palette: {
    mode: "dark",
    primary: {
      main: "#F39C6E",
      dark: "#FF6E27",
    },
    secondary: {
      main: "#92AE79",
    },
  },
});
