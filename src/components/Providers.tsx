import { CssBaseline } from "@mui/material";
import { UserProvider } from "../context/UserContext";
export const Providers = ({ children }: { children: React.ReactNode }) => {
  // Optional: define a function to update the theme if needed in the future

  return (
    <UserProvider>
      <CssBaseline />
      {children}
    </UserProvider>
  );
};
