export interface FileNode {
  id: string;
  name: string;
  path: string;
  size: number;
  projectRoot?: string;
}

export interface TreeItemData {
  ignorePatterns: string[];
  id: string;
  name: string;
  path: string; // This may be '.' or a full path
  isDirectory: boolean;
  children: TreeItemData[];
  loadedChildren: boolean;
}

export interface FileExplorerProps {
  onThemeChange: (primary: string, secondary: string, mode: string) => void;
  onPreviewFile: (event: React.SyntheticEvent, file: FileNode) => void;
  onFileSelect: (file: {
    id: string;
    name: string;
    path: string;
    size: number;
    projectRoot?: string;
  }) => void;
  projects: TreeItemData[];
  setProjects: React.Dispatch<React.SetStateAction<TreeItemData[]>>;
}
