import { TreeItem } from "@mui/lab";
import { Box } from "@mui/material";
import { InsertDriveFile as FileIcon } from "@mui/icons-material";
interface FileItemWithHoverProps {
  file: {
    id: string;
    name: string;
    path: string;
  };
  onFileHover?: (
    file: { id: string; name: string; path: string } | null
  ) => void;
  nodeId: string;
}
export default function FileItemWithHover({
  file,
  onFileHover,
  nodeId,
}: FileItemWithHoverProps) {
  const handleMouseEnter = () => {
    if (onFileHover) onFileHover(file);
  };
  const handleMouseLeave = () => {
    if (onFileHover) onFileHover(null);
  };
  return (
    <TreeItem
      nodeId={nodeId}
      label={
        <Box
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <FileIcon fontSize="small" />
          <span>{file.name}</span>
        </Box>
      }
    />
  );
}
