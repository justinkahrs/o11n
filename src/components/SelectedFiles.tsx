import { Box } from "@mui/material";
import { FolderGroup } from "./FolderGroup";
import { FileCard } from "./FileCard";

export interface FileNode {
  id: string;
  name: string;
  path: string;
  size: number;
}

interface SelectedFilesProps {
  files: FileNode[];
  onRemoveFile: (fileId: string) => void;
  onRemoveFolder: (folderPath: string) => void;
}

export function SelectedFiles({
  files,
  onRemoveFile,
  onRemoveFolder,
}: SelectedFilesProps) {
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
    <Box sx={{ overflowY: "auto" }}>
      {Object.keys(groupedFiles)
        .sort()
        .map((folder) => {
          const filesInFolder = groupedFiles[folder];
          const count = filesInFolder.length;
          const folderSize = filesInFolder.reduce((sum, f) => sum + f.size, 0);
          const percentage = totalSize
            ? ((folderSize / totalSize) * 100).toFixed(1)
            : "0";
          return (
            <FolderGroup
              key={folder}
              folder={folder}
              count={count}
              folderSize={folderSize}
              percentage={percentage}
              onRemoveFolder={onRemoveFolder}
              totalFolders={Object.keys(groupedFiles).length}
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
                        key={file.id}
                        file={file}
                        percentage={pct}
                        onRemoveFile={onRemoveFile}
                      />
                    );
                  })}
              </Box>
            </FolderGroup>
          );
        })}
    </Box>
  );
}
