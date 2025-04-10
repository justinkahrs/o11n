import { TreeItem } from "@mui/lab";
import { Box } from "@mui/material";
import { motion } from "framer-motion";
import { InsertDriveFile as FileIcon } from "@mui/icons-material";
import type { FileNode } from "../types";
interface FileItemWithHoverProps {
  file: FileNode;
  onPreviewFile: (event: React.SyntheticEvent, file: FileNode) => void;
  nodeId: string;
}
export default function FileItemWithHover({
  file,
  onPreviewFile,
  nodeId,
}: FileItemWithHoverProps) {
  const handleClick = (event: React.SyntheticEvent) => {
    event.stopPropagation();
    if (onPreviewFile) {
      onPreviewFile(event, file);
    }
  };
  // Removed handleMouseLeave to avoid flicker and allow selection.
  return (
    <TreeItem
      nodeId={nodeId}
      label={
        <Box
          component={motion.div}
          initial={{ marginLeft: 0 }}
          whileHover={{ marginLeft: 4 }}
          transition={{ type: "tween" }}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <FileIcon
            className="file-icon"
            sx={{
              color: "secondary.main",
              "&:hover": { color: "primary.main" },
            }}
            onClick={handleClick}
            fontSize="small"
          />
          <Box>{file.name}</Box>
        </Box>
      }
    />
  );
}
