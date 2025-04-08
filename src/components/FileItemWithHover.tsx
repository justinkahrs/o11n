import { TreeItem } from "@mui/lab";
import { Box } from "@mui/material";
import { InsertDriveFile as FileIcon } from "@mui/icons-material";
interface FileItemWithHoverProps {
  file: {
    id: string;
    name: string;
    path: string;
  };
  onFilePreviewClick?: (
    file: { id: string; name: string; path: string } | null,
    event?: React.SyntheticEvent<HTMLElement>
  ) => void;
  nodeId: string;
}
export default function FileItemWithHover({
  file,
  onFilePreviewClick,
  nodeId,
}: FileItemWithHoverProps) {
  const handleClick = (event: React.SyntheticEvent) => {
    event.stopPropagation();
    if (onFilePreviewClick) {
      onFilePreviewClick(event, file);
    }
  };
  // Removed handleMouseLeave to avoid flicker and allow selection.
  return (
    <TreeItem
      nodeId={nodeId}
      label={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FileIcon color="secondary" onClick={handleClick} fontSize="small" />
          <span>{file.name}</span>
        </Box>
      }
    />
  );
}
