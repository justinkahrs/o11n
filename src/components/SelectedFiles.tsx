import { Box } from "@mui/material";
import { FolderGroup } from "./FolderGroup";
import { FileCard } from "./FileCard";
import { useUserContext } from "../context/UserContext";
import { useAppContext } from "../context/AppContext";

export interface FileNode {
  id: string;
  name: string;
  path: string;
  size: number;
  projectRoot?: string;
}

interface SelectedFilesProps {
  mode: "talk" | "plan" | "do";
  plan: string;
  files: FileNode[];
  onRemoveFile: (fileId: string) => void;
  onRemoveFolder: (folderPath: string) => void;
}

export function SelectedFiles({
  mode,
  plan,
  files,
  onRemoveFile,
  onRemoveFolder,
}: SelectedFilesProps) {
  const { handleFilePreviewClick } = useAppContext();
  const doMode = mode === "do";
  const hide = doMode;
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const groupedFiles = files.reduce(
    (acc: { [folder: string]: FileNode[] }, file) => {
      const lastSlash = file.path.lastIndexOf("/");
      const folder =
        lastSlash !== -1 ? file.path.substring(0, lastSlash) : "Root";
      if (!acc[folder]) {
        acc[folder] = [];
      }
      acc[folder].push(file);
      return acc;
    },
    {} as { [folder: string]: FileNode[] }
  );

  return (
    !hide && (
      <Box sx={{ overflowY: "auto", px: 2 }}>
        {Object.keys(groupedFiles)
          .sort()
          .map((folder) => {
            const filesInFolder = groupedFiles[folder];
            const count = filesInFolder.length;
            const folderSize = filesInFolder.reduce(
              (sum, f) => sum + f.size,
              0
            );
            const percentage = totalSize
              ? ((folderSize / totalSize) * 100).toFixed(1)
              : "0";
            const projectRoot = filesInFolder[0].projectRoot
              ?.split("/")
              .filter(Boolean)
              .pop();
            return (
              <FolderGroup
                key={folder}
                folder={folder}
                count={count}
                folderSize={folderSize}
                percentage={percentage}
                onRemoveFolder={onRemoveFolder}
                totalFolders={Object.keys(groupedFiles).length}
                projectRoot={projectRoot}
              >
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {filesInFolder
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((file) => {
                      const pct = totalSize
                        ? ((file.size / totalSize) * 100).toFixed(1)
                        : "0";
                      return (
                        <FileCard
                          mode={mode}
                          plan={plan}
                          key={file.id}
                          file={file}
                          percentage={pct}
                          onRemoveFile={onRemoveFile}
                          onPreviewFile={handleFilePreviewClick}
                        />
                      );
                    })}
                </Box>
              </FolderGroup>
            );
          })}
      </Box>
    )
  );
}
