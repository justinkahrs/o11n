import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Box, Typography, IconButton, useTheme } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Folder from "@mui/icons-material/Folder";
import { formatFileSize } from "../utils/formatFileSize";
import { AccordionItem } from "./AccordionItem";
interface FolderGroupProps {
  folder: string;
  count: number;
  folderSize: number;
  percentage: string;
  onRemoveFolder: (folder: string) => void;
  children: React.ReactNode;
  totalFolders: number;
  projectRoot?: string;
}
export function FolderGroup({
  folder,
  count,
  folderSize,
  percentage,
  onRemoveFolder,
  children,
  totalFolders,
  projectRoot,
}: FolderGroupProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(totalFolders < 3);
  const prevTotalRef = useRef(totalFolders);
  useEffect(() => {
    prevTotalRef.current = totalFolders;
  }, [totalFolders]);
  let displayedFolder = folder;
  if (projectRoot) {
    const segments = folder.split("/").filter(Boolean);
    const projIndex = segments.indexOf(projectRoot);
    if (projIndex !== -1) {
      displayedFolder = segments.slice(projIndex).join("/");
    }
  }
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "4px",
        overflow: "hidden",
        marginBottom: "8px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0px 8px",
          cursor: "pointer",
          borderRadius: "4px 4px 0 0",
          backgroundColor: theme.palette.secondary.main,
        }}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={() => setExpanded(!expanded)}
      >
        <Box
          sx={{
            display: "flex",
            alignContent: "center",
            flexGrow: 1,
          }}
        >
          <Typography
            variant="subtitle1"
            style={{ display: "flex", alignItems: "center" }}
          >
            <Folder style={{ marginRight: ".5rem" }} />
            {`${displayedFolder} - ${count} file${count === 1 ? "" : "s"}`}
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", ml: 1 }}
            >
              {` - ${formatFileSize(folderSize)} (${percentage}%)`}
            </Typography>
          </Typography>
        </Box>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFolder(folder);
          }}
          aria-label="delete folder"
        >
          <DeleteIcon sx={{ fontSize: "18px" }} />
        </IconButton>
      </div>
      <AccordionItem isOpen={expanded}>
        <div
          style={{
            padding: "8px",
            borderTop: "1px solid #ccc",
          }}
        >
          {children}
        </div>
      </AccordionItem>
    </div>
  );
}
