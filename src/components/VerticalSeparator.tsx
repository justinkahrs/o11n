import { useEffect, useState, type RefObject } from "react";
import { ChevronRight, ChevronLeft } from "@mui/icons-material";
import { Box, IconButton } from "@mui/material";

interface VerticalSeparatorProps {
  containerRef: RefObject<HTMLDivElement>;
  setExplorerWidth: React.Dispatch<React.SetStateAction<number>>;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setIsResizing: React.Dispatch<React.SetStateAction<boolean>>;
}

const VerticalSeparator = ({
  containerRef,
  setExplorerWidth,
  isCollapsed,
  setIsCollapsed,
  setIsResizing,
}: VerticalSeparatorProps) => {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setIsResizing(isDragging);
  }, [isDragging, setIsResizing]);

  // Handle mouse move events to update explorerWidth when dragging.
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      let newWidth = e.clientX - containerRect.left;

      // Snapping logic: if dragged very small, collapse it.
      if (newWidth < 50) {
        setIsCollapsed(true);
        return;
      }

      if (isCollapsed && newWidth > 80) {
        setIsCollapsed(false);
      }

      // Set minimum width of 100px and a maximum width based on container size.
      const maxWidth = containerRect.width - 200;
      if (newWidth < 100) newWidth = 100;
      else if (newWidth > maxWidth) newWidth = maxWidth;

      setExplorerWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [containerRef, setExplorerWidth, isDragging, isCollapsed, setIsCollapsed]);

  return (
    <Box
      onMouseDown={() => setIsDragging(true)}
      className="vertical-separator"
      sx={{
        width: "5px",
        flexShrink: 0,
        cursor: "col-resize",
        backgroundColor: "rgba(0,0,0,0.1)",
        "&:hover": {
          backgroundColor: "primary.main",
        },
        transition: "background-color 0.2s",
        mx: 1,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 1,
        zIndex: 10,
      }}
    >
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          setIsCollapsed(!isCollapsed);
        }}
        size="small"
        sx={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          padding: "2px",
          width: "20px",
          height: "20px",
          "&:hover": {
            backgroundColor: "primary.main",
          },
          zIndex: 11,
        }}
      >
        {isCollapsed ? (
          <ChevronRight sx={{ fontSize: "16px" }} />
        ) : (
          <ChevronLeft sx={{ fontSize: "16px" }} />
        )}
      </IconButton>
      <Box
        sx={{
          width: "3px",
          height: "40px",
          backgroundColor: "primary.main",
          borderRadius: "2px",
        }}
      />
    </Box>
  );
};

export default VerticalSeparator;
