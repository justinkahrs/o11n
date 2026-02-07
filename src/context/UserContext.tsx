import { createTheme, ThemeProvider } from "@mui/material";
import {
  createContext,
  useState,
  type ReactNode,
  useContext,
  useCallback,
} from "react";
import { theme } from "../theme";

interface UserContextType {
  countTokens: boolean;
  formatOutput: boolean;
  includeFileTree: boolean;
  loading: boolean;
  onThemeChange: (
    primary: string,
    secondary: string,
    mode: "light" | "dark",
  ) => void;
  primaryColor: string;
  secondaryColor: string;
  themeMode: "light" | "dark";
  showDotfiles: boolean;
  useIgnoreFiles: boolean;
  showShortcuts: boolean;
  setCountTokens: React.Dispatch<React.SetStateAction<boolean>>;
  setIncludeFileTree: React.Dispatch<React.SetStateAction<boolean>>;
  setFormatOutput: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDotfiles: React.Dispatch<React.SetStateAction<boolean>>;
  setUseIgnoreFiles: React.Dispatch<React.SetStateAction<boolean>>;
  setShowShortcuts: React.Dispatch<React.SetStateAction<boolean>>;
  setPrimaryColor: React.Dispatch<React.SetStateAction<string>>;
  setSecondaryColor: React.Dispatch<React.SetStateAction<string>>;
  setThemeMode: React.Dispatch<React.SetStateAction<"light" | "dark">>;
  showLogo: boolean;
  setShowLogo: React.Dispatch<React.SetStateAction<boolean>>;
  apiKey: string;
  setApiKey: React.Dispatch<React.SetStateAction<string>>;
  apiMode: boolean;
  setApiMode: React.Dispatch<React.SetStateAction<boolean>>;
  zaiApiKey: string;
  setZaiApiKey: React.Dispatch<React.SetStateAction<string>>;
  openAiApiKey: string;
  setOpenAiApiKey: React.Dispatch<React.SetStateAction<string>>;
  activeProvider: "zai" | "openai";
  setActiveProvider: React.Dispatch<React.SetStateAction<"zai" | "openai">>;
}
const UserContext = createContext<UserContextType | undefined>(undefined);
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [showDotfiles, setShowDotfiles] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(true);
  const [useIgnoreFiles, setUseIgnoreFiles] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("dark");
  const [primaryColor, setPrimaryColor] = useState(theme.palette.primary.main);
  const [secondaryColor, setSecondaryColor] = useState(
    theme.palette.secondary.main,
  );
  const [countTokens, setCountTokens] = useState(true);
  const [formatOutput, setFormatOutput] = useState(true);
  const [includeFileTree, setIncludeFileTree] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [zaiApiKey, setZaiApiKey] = useState("");
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [activeProvider, setActiveProvider] = useState<"zai" | "openai">("zai");
  const [apiMode, setApiMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const onThemeChange = useCallback(
    (primary: string, secondary: string, mode: "light" | "dark") => {
      setPrimaryColor(primary);
      setSecondaryColor(secondary);
      setThemeMode(mode);
      setCurrentTheme(
        createTheme({
          typography: theme.typography,
          palette: {
            mode,
            primary: { main: primary },
            secondary: { main: secondary },
          },
        }),
      );
    },
    [],
  );

  return (
    <UserContext.Provider
      value={{
        showDotfiles,
        setShowDotfiles,
        includeFileTree,
        setIncludeFileTree,
        onThemeChange,
        primaryColor,
        secondaryColor,
        themeMode,
        setPrimaryColor,
        setSecondaryColor,
        setThemeMode,
        countTokens,
        setCountTokens,
        formatOutput,
        setFormatOutput,
        loading,
        setLoading,
        showLogo,
        setShowLogo,
        useIgnoreFiles,
        setUseIgnoreFiles,
        showShortcuts,
        setShowShortcuts,
        apiKey,
        setApiKey,
        apiMode,
        setApiMode,
        zaiApiKey,
        setZaiApiKey,
        openAiApiKey,
        setOpenAiApiKey,
        activeProvider,
        setActiveProvider,
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
