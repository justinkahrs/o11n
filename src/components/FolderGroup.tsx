import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import Folder from "@mui/icons-material/Folder";
import { formatFileSize } from "../utils/formatFileSize";

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
    <Accordion
      square={false}
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      sx={{ borderRadius: "10px" }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`panel-${displayedFolder}-content`}
        id={`panel-${displayedFolder}-header`}
        sx={{
          borderRadius: "4px 4px 0 0",
          borderLeft: "1px solid #ccc",
          borderRight: "1px solid #ccc",
          borderTop: "1px solid #ccc",
          ...(!expanded && { borderBottom: "1px solid #ccc" }),
        }}
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
          <DeleteIcon />
        </IconButton>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          borderRadius: " 0 0 4px 4px",
          borderLeft: "1px solid #ccc",
          borderRight: "1px solid #ccc",
          borderBottom: "1px solid #ccc",
          ...(!expanded && { borderTop: "1px solid #ccc" }),
        }}
      >
        {children}
      </AccordionDetails>
    </Accordion>
  );
}
