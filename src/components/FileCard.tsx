import React from "react";
import { ListItem, ListItemText, IconButton } from "@mui/material";
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
    <ListItem
      sx={{
        display: "inline-flex",
        borderRadius: "10px",
        border: "1px solid",
        padding: 0.5,
        margin: 0,
        flex: "0 0 23%",
        maxWidth: "23%",
      }}
      secondaryAction={
        <IconButton
          edge="end"
          aria-label="delete"
          onClick={() => onRemoveFile(file.id)}
        >
          <DeleteIcon />
        </IconButton>
      }
    >
      <ListItemText
        primary={`📄 ${file.name}`}
        secondary={`${formatFileSize(file.size)} (${percentage}%)`}
      />
    </ListItem>
  );
}
