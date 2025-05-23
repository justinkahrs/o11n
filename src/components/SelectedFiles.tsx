import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { FolderGroup } from "./FolderGroup";
import { FileCard } from "./FileCard";
import { useAppContext } from "../context/AppContext";
import type { FileNode } from "../types";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useUserContext } from "../context/UserContext";

export function SelectedFiles() {
  const { mode, selectedFiles, setSelectedFiles, totalTokenCount } =
    useAppContext();
  const { countTokens } = useUserContext();
  const doMode = mode === "do";
  const totalSize = selectedFiles.reduce((sum, f) => sum + (f.size ?? 0), 0);
  const [allExpanded, setAllExpanded] = useState<boolean>(true);

  useEffect(() => {
    const recalcTokenSizes = async () => {
      if (selectedFiles.length < 1) return;
      if (countTokens) {
        let hasUpdate = false;
        const updatedFiles = await Promise.all(
          selectedFiles.map(async (file) => {
            if (typeof file.tokenSize === "undefined") {
              const tokenCount = await invoke("count_tokens_path", {
                path: file.path,
              });
              hasUpdate = true;
              return { ...file, tokenSize: Number(tokenCount) };
            }
            return file;
          })
        );
        if (hasUpdate) {
          setSelectedFiles(updatedFiles);
        }
      }
    };
    recalcTokenSizes();
  }, [countTokens, selectedFiles, setSelectedFiles]);

  const groupedFiles = selectedFiles.reduce(
    (acc: { [folder: string]: FileNode[] }, file) => {
      const folder = file.projectRoot ?? "Root";
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
      prev.filter((file) => file.projectRoot !== folderPath)
    );
  }

  return (
    !doMode && (
      <Box sx={{ overflowY: "auto", px: 2 }}>
        {selectedFiles.length > 0 && (
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              display: "flex",
              justifyContent: countTokens ? "space-between" : "flex-end",
              backgroundColor: "background.paper", // Added solid background color
            }}
          >
            {countTokens && (
              <Typography
                alignContent="flex-end"
                variant="body1"
                sx={{ mb: 1 }}
              >
                Total tokens: {totalTokenCount}
              </Typography>
            )}
            <IconButton
              onClick={() => setAllExpanded((prev) => !prev)}
              sx={{
                transform: allExpanded ? "rotate(0deg)" : "rotate(180deg)",
                transition: "transform 0.3s",
                mb: 1,
              }}
            >
              <Tooltip
                arrow
                enterDelay={2000}
                title={allExpanded ? "Collapse All" : "Expand All"}
                placement="left"
              >
                <ExpandMoreIcon fontSize="small" />
              </Tooltip>
            </IconButton>
          </Box>
        )}
        {Object.keys(groupedFiles)
          .sort()
          .map((folder) => {
            const filesInFolder = groupedFiles[folder];
            const folderSize = filesInFolder.reduce(
              (sum, f) => sum + (f.size ?? 0),
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
                folderSize={folderSize}
                percentage={percentage}
                onRemoveFolder={handleRemoveFolder}
                totalFolders={Object.keys(groupedFiles).length}
                projectRoot={projectRoot}
                forceExpanded={allExpanded}
              >
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {filesInFolder
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((file) => {
                      const pct = totalSize
                        ? (((file.size ?? 0) / totalSize) * 100).toFixed(1)
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
