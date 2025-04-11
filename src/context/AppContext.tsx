import { createContext, useState, type ReactNode, useContext } from "react";
import type { CustomTemplate, FileNode, TreeItemData } from "../types";
interface AppContextType {
  handleFileSelect: (file: FileNode) => void;
  handleFilePreviewClick: (
    _event: React.SyntheticEvent,
    file: FileNode
  ) => void;
  plan: string;
  setPlan: React.Dispatch<React.SetStateAction<string>>;
  customTemplates: CustomTemplate[];
  setCustomTemplates: React.Dispatch<React.SetStateAction<CustomTemplate[]>>;
  instructions: string;
  mode: "talk" | "plan" | "do";
  setMode: React.Dispatch<React.SetStateAction<"talk" | "plan" | "do">>;
  setInstructions: React.Dispatch<React.SetStateAction<string>>;
  selectedFiles: FileNode[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<FileNode[]>>;
  selectedFile: FileNode | null | undefined;
  setSelectedFile: React.Dispatch<
    React.SetStateAction<FileNode | null | undefined>
  >;
  projects: TreeItemData[];
  setProjects: React.Dispatch<React.SetStateAction<TreeItemData[]>>;
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
