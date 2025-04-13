import { createTheme, ThemeProvider } from "@mui/material";
import { createContext, useState, type ReactNode, useContext } from "react";
import { theme } from "../theme";
interface UserContextType {
  onThemeChange: (
    primary: string,
    secondary: string,
    mode: "light" | "dark"
  ) => void;
  showDotfiles: boolean;
  setShowDotfiles: React.Dispatch<React.SetStateAction<boolean>>;
  countTokens: boolean;
  setCountTokens: React.Dispatch<React.SetStateAction<boolean>>;
}
const UserContext = createContext<UserContextType | undefined>(undefined);
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [showDotfiles, setShowDotfiles] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [countTokens, setCountTokens] = useState(false);
  const onThemeChange = (
    primary: string,
    secondary: string,
    mode: "light" | "dark"
  ) => {
    setCurrentTheme(
      createTheme({
        typography: theme.typography,
        palette: {
          mode,
          primary: { main: primary },
          secondary: { main: secondary },
        },
      })
    );
  };
  return (
    <UserContext.Provider
      value={{
        showDotfiles,
        setShowDotfiles,
        onThemeChange,
        countTokens,
        setCountTokens,
      }}
    >
      <ThemeProvider theme={currentTheme}>{children}</ThemeProvider>
    </UserContext.Provider>
  );
};
export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
export default UserContext;
