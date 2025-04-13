import { Box, Typography, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFile from "@mui/icons-material/InsertDriveFile";

import { formatFileSize } from "../utils/formatFileSize";
import { useAppContext } from "../context/AppContext";
import type { FileNode } from "../types";

interface FileCardProps {
  file: FileNode;
  percentage: string;
  onRemoveFile: (fileId: string) => void;
}

export function FileCard({ file, percentage, onRemoveFile }: FileCardProps) {
  const { mode, plan, handleFilePreviewClick } = useAppContext();
  const doMode = mode === "do";
  let changeDescription = "";
  if (doMode && plan) {
    const escapeRegex = (str: string) =>
      str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const filePathRegex = escapeRegex(file.path);
    const pattern = new RegExp(
      `### File\\s+.*${filePathRegex}[\\s\\S]*?\\*\\*Description\\*\\*:\\s*(.*)`
    );
    const match = plan.match(pattern);
    if (match) {
      changeDescription = match[1].trim();
    }
  }
  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: "4px",
        border: "1px solid lightgrey",
        padding: 2,
        margin: 0,
        minWidth: doMode ? "100%" : "20%",
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
        <Typography
          variant="subtitle2"
          onClick={(e) => handleFilePreviewClick(e, file)}
          sx={{
            cursor: "pointer",
            "&:hover .file-icon": { color: "primary.main" },
          }}
        >
          <InsertDriveFile className="file-icon" color="secondary" />
        </Typography>
        <Typography variant="subtitle2">{file.name}</Typography>
        <Typography variant="caption">
          {formatFileSize(file.size)} ({percentage}%)
        </Typography>
        <br />
        <Typography variant="caption">Tokens: {file.tokenSize}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {changeDescription}
        </Typography>
      </Box>
    </Box>
  );
}
