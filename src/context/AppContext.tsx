import { createContext, useState, type ReactNode, useContext } from "react";
import type { CustomTemplate, FileNode, TreeItemData } from "../types";
interface AppContextType {
  customTemplates: CustomTemplate[];
  instructions: string;
  handleFileSelect: (file: FileNode) => void;
  handleFilePreviewClick: (
    _event: React.SyntheticEvent,
    file: FileNode
  ) => void;
  mode: "talk" | "plan" | "do";
  plan: string;
  projects: TreeItemData[];
  selectedFile: FileNode | null | undefined;
  selectedFiles: FileNode[];
  setCustomTemplates: React.Dispatch<React.SetStateAction<CustomTemplate[]>>;
  setInstructions: React.Dispatch<React.SetStateAction<string>>;
  setMode: React.Dispatch<React.SetStateAction<"talk" | "plan" | "do">>;
  setPlan: React.Dispatch<React.SetStateAction<string>>;
  setProjects: React.Dispatch<React.SetStateAction<TreeItemData[]>>;
  setSelectedFile: React.Dispatch<
    React.SetStateAction<FileNode | null | undefined>
  >;
  setSelectedFiles: React.Dispatch<React.SetStateAction<FileNode[]>>;
  // Selection state for change descriptions in a plan (file path -> list of booleans)
  selectedDescriptions: Record<string, boolean[]>;
  setSelectedDescriptions: React.Dispatch<React.SetStateAction<Record<string, boolean[]>>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<"talk" | "plan" | "do">("plan");
  const [instructions, setInstructions] = useState("");
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [plan, setPlan] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>();
  const [projects, setProjects] = useState<TreeItemData[]>([]);
  // State for tracking which change descriptions are selected per file
  const [selectedDescriptions, setSelectedDescriptions] = useState<Record<string, boolean[]>>({});
  const handleFilePreviewClick = (
    _event: React.SyntheticEvent,
    file: FileNode
  ) => {
    // If the same file is clicked again, toggle off the preview.
    if (selectedFile && file && selectedFile.id === file.id) {
      setSelectedFile(null);
    } else {
      setSelectedFile(file);
    }
    setMode("plan");
  };
  function handleFileSelect(file: FileNode) {
    setSelectedFiles((prev) => {
      if (prev.some((f) => f.path === file.path)) {
        return prev.filter((f) => f.path !== file.path);
      }
      return [...prev, file];
    });
  }
  return (
      <AppContext.Provider
      value={{
        handleFilePreviewClick,
        handleFileSelect,
        projects,
        setProjects,
        selectedFile,
        setSelectedFile,
        selectedFiles,
        setSelectedFiles,
        plan,
        setPlan,
        mode,
        setMode,
        instructions,
        setInstructions,
        customTemplates,
        setCustomTemplates,
        // selected descriptions for plan change preview
        selectedDescriptions,
        setSelectedDescriptions,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within a AppProvider");
  }
  return context;
};
export default AppContext;
