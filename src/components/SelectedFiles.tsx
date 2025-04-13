import { Box } from "@mui/material";
import { FolderGroup } from "./FolderGroup";
import { FileCard } from "./FileCard";
import { useAppContext } from "../context/AppContext";

export interface FileNode {
  id: string;
  name: string;
  path: string;
  size: number;
  projectRoot?: string;
}

export function SelectedFiles() {
  const { mode, selectedFiles, setSelectedFiles } = useAppContext();
  const doMode = mode === "do";
  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
  const groupedFiles = selectedFiles.reduce(
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

  function handleRemoveFile(fileId: string) {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== fileId));
  }
  function handleRemoveFolder(folderPath: string) {
    setSelectedFiles((prev) =>
      prev.filter((file) => {
        const lastSlash = file.path.lastIndexOf("/");
        const fileFolder =
          lastSlash !== -1 ? file.path.substring(0, lastSlash) : "Root";
        return fileFolder !== folderPath;
      })
    );
  }

  return (
    !doMode && (
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
                onRemoveFolder={handleRemoveFolder}
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
                          key={file.id}
                          file={file}
                          percentage={pct}
                          onRemoveFile={handleRemoveFile}
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
