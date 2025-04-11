import { CssBaseline } from "@mui/material";
import { UserProvider } from "../context/UserContext";
import { AppProvider } from "../context/AppContext";
export const Providers = ({ children }: { children: React.ReactNode }) => {
  // Optional: define a function to update the theme if needed in the future

  return (
    <AppProvider>
      <UserProvider>
        <CssBaseline />
        {children}
      </UserProvider>
    </AppProvider>
  );
};
