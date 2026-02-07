import { TreeItem } from "@mui/lab";
import { Box, Tooltip } from "@mui/material";
import { motion } from "framer-motion";
import { InsertDriveFile, Delete } from "@mui/icons-material";
import type { FileNode } from "../types";
interface FileItemWithHoverProps {
  file: FileNode;
  onPreviewFile: (event: React.SyntheticEvent, file: FileNode) => void;
  onDelete: (event: React.SyntheticEvent, file: FileNode) => void;
  nodeId: string;
}
export default function FileItemWithHover({
  file,
  onPreviewFile,
  onDelete,
  nodeId,
}: FileItemWithHoverProps) {
  const handleClick = (event: React.SyntheticEvent) => {
    event.stopPropagation();
    onPreviewFile(event, file);
  };
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
          <Tooltip
            arrow
            disableInteractive
            enterDelay={500}
            enterNextDelay={500}
            placement="left"
            title="Preview"
          >
            <InsertDriveFile
              className="file-icon"
              sx={{
                color: "secondary.main",
                "&:hover": { color: "primary.main" },
              }}
              onClick={handleClick}
              fontSize="small"
            />
          </Tooltip>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexGrow: 1,
              justifyContent: "space-between",
              "& .delete-icon": { visibility: "hidden" },
              "&:hover .delete-icon": { visibility: "visible" },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box>{file.name}</Box>
            </Box>

            <Tooltip
              arrow
              disableInteractive
              enterDelay={500}
              title="Delete file"
            >
              <Delete
                className="delete-icon"
                sx={{
                  fontSize: "1rem",
                  color: "text.secondary",
                  "&:hover": { color: "error.main" },
                  ml: "auto",
                  mr: 1,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(e, file);
                }}
              />
            </Tooltip>
          </Box>
        </Box>
      }
    />
  );
}
