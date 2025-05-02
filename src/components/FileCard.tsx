import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFile from "@mui/icons-material/InsertDriveFile";

import { formatFileSize } from "../utils/formatFileSize";
import { useAppContext } from "../context/AppContext";
import type { FileNode } from "../types";
import { useUserContext } from "../context/UserContext";

interface FileCardProps {
  file: FileNode;
  percentage: string;
  onRemoveFile: (fileId: string) => void;
}

export function FileCard({ file, percentage, onRemoveFile }: FileCardProps) {
  const { mode, handleFilePreviewClick } = useAppContext();
  const { countTokens } = useUserContext();
  const doMode = mode === "do";

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
      <Tooltip
        arrow
        disableInteractive
        enterDelay={500}
        placement="right"
        title="Remove file"
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
      </Tooltip>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
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
            display: "inline-flex",
            "&:hover .file-icon": { color: "primary.main" },
          }}
        >
          <Tooltip
            arrow
            disableInteractive
            enterDelay={500}
            title="Preview"
            placement="right"
          >
            <InsertDriveFile className="file-icon" color="secondary" />
          </Tooltip>
        </Typography>
        <Typography variant="subtitle2">{file.name}</Typography>
        <Typography variant="caption" sx={{ m: 0, p: 0 }}>
          {formatFileSize(file.size)} ({percentage}%)
        </Typography>
        {countTokens && (
          <Typography variant="caption" sx={{ m: 0, p: 0 }}>
            {file.tokenSize} tokens
          </Typography>
        )}
      </Box>
    </Box>
  );
}
