import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { FileNode } from "./SelectedFiles";
import { formatFileSize } from "../utils/formatFileSize";

interface FileCardProps {
  file: FileNode;
  percentage: string;
  onRemoveFile: (fileId: string) => void;
}

export function FileCard({ file, percentage, onRemoveFile }: FileCardProps) {
  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: "10px",
        border: "1px solid",
        padding: 2,
        margin: 0,
        flex: "0 0 23%",
        maxWidth: "23%",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <IconButton
        aria-label="delete"
        onClick={() => onRemoveFile(file.id)}
        sx={{
          position: "absolute",
          top: 4,
          right: 4,
        }}
      >
        <DeleteIcon />
      </IconButton>
      <Box sx={{ wordWrap: "break-word", whiteSpace: "normal", paddingRight: "40px" }}>
        <Typography variant="subtitle1" sx={{ wordBreak: "break-all" }}>
          📄 {file.name}
        </Typography>
        <Typography variant="body2">
          {formatFileSize(file.size)} ({percentage}%)
        </Typography>
      </Box>
    </Box>
  );
}