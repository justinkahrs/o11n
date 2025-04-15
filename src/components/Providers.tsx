import { CssBaseline } from "@mui/material";
import { UserProvider } from "../context/UserContext";
import { AppProvider } from "../context/AppContext";
import ContextPersistenceManager from "./ContextPersistenceManager";
export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppProvider>
      <UserProvider>
        <CssBaseline />
        <ContextPersistenceManager />
        {children}
      </UserProvider>
    </AppProvider>
  );
};
