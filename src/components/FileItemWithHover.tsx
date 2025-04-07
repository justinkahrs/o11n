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
    file: { id: string; name: string; path: string } | null,
    event?: React.MouseEvent<HTMLElement>
  ) => void;
  nodeId: string;
}
export default function FileItemWithHover({
  file,
  onFileHover,
  nodeId,
}: FileItemWithHoverProps) {
  const handleMouseEnter = (event) => {
    event.stopPropagation();
    if (onFileHover) {
      console.log("sending file: ", file);
      onFileHover(event, file);
    }
  };
  // Removed handleMouseLeave to avoid flicker and allow selection.
  return (
    <TreeItem
      nodeId={nodeId}
      label={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FileIcon onClick={handleMouseEnter} fontSize="small" />
          <span>{file.name}</span>
        </Box>
      }
    />
  );
}
