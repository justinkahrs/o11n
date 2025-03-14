import React, { useState, useEffect, useRef } from "react";
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
    if (prevTotalRef.current < 3 && totalFolders === 3) {
      setExpanded(false);
    }
    prevTotalRef.current = totalFolders;
  }, [totalFolders]);

  const displayedFolder = projectRoot && folder.startsWith(projectRoot)
    ? folder.slice(projectRoot.length).replace(/^[/\\]+/, '')
    : folder;

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`panel-${displayedFolder}-content`}
        id={`panel-${displayedFolder}-header`}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1">
            {`📁 ${displayedFolder} - ${count} file${count === 1 ? "" : "s"}`}
          </Typography>
          <Typography
            variant="caption"
            sx={{ display: "block", color: "text.secondary" }}
          >
            {`${formatFileSize(folderSize)} (${percentage}%)`}
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
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
}