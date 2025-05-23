import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Box, Typography, IconButton, useTheme, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Folder from "@mui/icons-material/Folder";
import { formatFileSize } from "../utils/formatFileSize";
import { AccordionItem } from "./AccordionItem";
interface FolderGroupProps {
  folder: string;
  folderSize: number;
  percentage: string;
  onRemoveFolder: (folder: string) => void;
  children: React.ReactNode;
  totalFolders: number;
  projectRoot?: string;
  forceExpanded?: boolean;
}
export function FolderGroup({
  folder,
  folderSize,
  percentage,
  onRemoveFolder,
  children,
  totalFolders,
  projectRoot,
  forceExpanded,
}: FolderGroupProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);
  const prevTotalRef = useRef(totalFolders);
  useEffect(() => {
    setExpanded(forceExpanded !== undefined ? forceExpanded : true);
  }, [forceExpanded]);
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
            justifyContent: "space-between",
            flexGrow: 1,
          }}
        >
          <Typography
            variant="subtitle1"
            style={{
              display: "flex",
              alignItems: "center",
              wordBreak: "keep-all",
              textOverflow: "ellipsis",
              overflowX: "hidden",
            }}
          >
            <Folder style={{ marginRight: ".5rem" }} />
            <Typography sx={{ lineHeight: "1.2rem" }}>
              {`${displayedFolder}`}
            </Typography>
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "end" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                textAlign: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", ml: 1 }}
              >
                {`${formatFileSize(folderSize)} `}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", ml: 1 }}
              >
                {`(${percentage}%)`}
              </Typography>
            </Box>
            <Tooltip
              arrow
              disableInteractive
              enterDelay={500}
              title="Remove folder"
            >
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFolder(folder);
                }}
                aria-label="delete folder"
              >
                <DeleteIcon sx={{ fontSize: "18px" }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
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
