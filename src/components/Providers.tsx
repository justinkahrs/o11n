import { CssBaseline } from "@mui/material";
import { UserProvider } from "../context/UserContext";
import { AppProvider } from "../context/AppContext";
export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppProvider>
      <UserProvider>
        <CssBaseline />
        {children}
      </UserProvider>
    </AppProvider>
  );
};
