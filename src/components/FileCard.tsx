import { Box, Typography, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFile from "@mui/icons-material/InsertDriveFile";

import type { FileNode } from "./SelectedFiles";
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
        border: "1px solid lightgrey",
        padding: 2,
        margin: 0,
        minWidth: "20%",
        maxWidth: "50%",
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
        <DeleteIcon sx={{ fontSize: "18px" }} />
      </IconButton>
      <Box
        sx={{
          wordWrap: "break-word",
          whiteSpace: "normal",
          paddingRight: "40px",
        }}
      >
        <Typography variant="subtitle2">
          <InsertDriveFile color="secondary" />
        </Typography>
        <Typography variant="subtitle2">{file.name}</Typography>
        <Typography variant="caption">
          {formatFileSize(file.size)} ({percentage}%)
        </Typography>
      </Box>
    </Box>
  );
}
