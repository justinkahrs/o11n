import React from "react";
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
}

export function FolderGroup({
  folder,
  count,
  folderSize,
  percentage,
  onRemoveFolder,
  children,
}: FolderGroupProps) {
  return (
    <Accordion defaultExpanded sx={{ mb: 2 }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`panel-${folder}-content`}
        id={`panel-${folder}-header`}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1">
            📁 {folder} - {count} files selected
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
