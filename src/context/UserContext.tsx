import { createTheme, ThemeProvider } from "@mui/material";
import { createContext, useState, type ReactNode, useContext } from "react";
import { theme } from "../theme";

interface UserContextType {
  countTokens: boolean;
  formatOutput: boolean;
  includeFileTree: boolean;
  loading: boolean;
  onThemeChange: (
    primary: string,
    secondary: string,
    mode: "light" | "dark"
  ) => void;
  showDotfiles: boolean;
  setCountTokens: React.Dispatch<React.SetStateAction<boolean>>;
  setIncludeFileTree: React.Dispatch<React.SetStateAction<boolean>>;
  setFormatOutput: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDotfiles: React.Dispatch<React.SetStateAction<boolean>>;
  showLogo: boolean;
  setShowLogo: React.Dispatch<React.SetStateAction<boolean>>;
}
const UserContext = createContext<UserContextType | undefined>(undefined);
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [showDotfiles, setShowDotfiles] = useState(false);
  const [showLogo, setShowLogo] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [countTokens, setCountTokens] = useState(false);
  const [formatOutput, setFormatOutput] = useState(true);
  const [includeFileTree, setIncludeFileTree] = useState(true);
  const [loading, setLoading] = useState(false);
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
        includeFileTree,
        setIncludeFileTree,
        onThemeChange,
        countTokens,
        setCountTokens,
        formatOutput,
        setFormatOutput,
        loading,
        setLoading,
        showLogo,
        setShowLogo,
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
