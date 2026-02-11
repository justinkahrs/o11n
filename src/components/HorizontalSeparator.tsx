import { Box, IconButton } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { KeyboardArrowUp, KeyboardArrowDown } from "@mui/icons-material";

interface HorizontalSeparatorProps {
  containerRef: React.RefObject<HTMLDivElement>;
  setHeight: (height: number) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const HorizontalSeparator: React.FC<HorizontalSeparatorProps> = ({
  containerRef,
  setHeight,
  isCollapsed,
  setIsCollapsed,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = "row-resize";
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = "default";
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const relativeY = e.clientY - containerRect.top;

      // Snapping logic: if dragged very small, collapse it.
      if (relativeY < 50) {
        setIsCollapsed(true);
        return;
      }

      if (isCollapsed && relativeY > 80) {
        setIsCollapsed(false);
      }

      const newHeight = relativeY;

      // Constrain min/max if needed (e.g. min 100px)
      if (newHeight > 100 && newHeight < containerRect.height - 100) {
        setHeight(newHeight);
      }
    },
    [isDragging, containerRef, setHeight, isCollapsed, setIsCollapsed],
  );

  useEffect(() => {
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
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <Box
      onMouseDown={handleMouseDown}
      sx={{
        height: "5px",
        cursor: "row-resize",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.1)",
        "&:hover": {
          backgroundColor: "primary.main",
        },
        transition: "background-color 0.2s",
        zIndex: 10,
        my: 1,
        borderRadius: 1,
        position: "relative",
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
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
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
          <KeyboardArrowDown sx={{ fontSize: "16px" }} />
        ) : (
          <KeyboardArrowUp sx={{ fontSize: "16px" }} />
        )}
      </IconButton>
      {/* Optional handle graphic */}
      <Box
        sx={{
          width: "40px",
          height: "3px",
          backgroundColor: "primary.main",
          borderRadius: "2px",
        }}
      />
    </Box>
  );
};

export default HorizontalSeparator;
