export interface FileNode {
  id: string;
  name: string;
  path: string;
  size?: number;
  tokenSize?: number;
  projectRoot?: string;
}

export interface CustomTemplate {
  id: string;
  name: string;
  path: string;
  active: boolean;
}
export interface TreeItemData {
  id: string;
  name: string;
  path: string; // This may be '.' or a full path
  isDirectory: boolean;
  children: TreeItemData[];
  loadedChildren: boolean;
}

export interface FileExplorerProps {
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
