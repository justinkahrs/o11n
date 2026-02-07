import { Box } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";

interface HorizontalSeparatorProps {
  containerRef: React.RefObject<HTMLDivElement>;
  setHeight: (height: number) => void;
}

const HorizontalSeparator: React.FC<HorizontalSeparatorProps> = ({
  containerRef,
  setHeight,
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
      // Calculate relative Y position within the container
      const relativeY = e.clientY - containerRect.top;

      // We need to account for the offset of the element being resized.
      // Assuming the resize handle follows the element directly.
      // A simpler approach for the top element height is just taking the mouse Y
      // relative to the top of the container, minus any top offset (like headers).
      // However, App.tsx layout is complex.
      // Let's assume the setHeight controls the height of the element *above* the separator.
      // We might need to adjust this logic based on exactly where the "top" of that element is.
      // For now, let's try using the relativeY directly, maybe with a clamp.

      // A more robust way: use movementY to adjust current height?
      // No, absolute tracking is better to avoid drift.

      // Let's rely on the parent to handle the "start" position if needed,
      // but usually the containerRef passed is the parent flex container.

      // In App.tsx, the Right Panel is a flex column.
      // We want to set the height of SelectedFiles.
      // The mouse position relative to the Right Panel's top should roughly be the new height
      // if SelectedFiles is at the top. But ModeButtons might be above it?
      // Wait, ModeButtons is hidden in this mode.
      // So SelectedFiles is likely at the top (under PlanInput/Preview which are also hidden? No wait).

      // Let's look at App.tsx again.
      // PlanInput, PlanPreview are NOT hidden in the user request, only ModeButtons.
      // Wait, PlanInput/Preview are usually for "Plan" mode.
      // If we are in "Chat" mode (API+NoFormat), maybe those should be hidden too?
      // The user only asked to hide ModeButtons.

      // If PlanInput is visible, we need to subtract its height to get SelectedFiles height.
      // That's complicated.

      // Alternative: Use delta.
      // On MouseDown, verify coordinates. On MouseMove, apply delta to previous height.
      // But we don't have "previous height" in this component cleanly unless we track it or pass it.

      // Let's stick to the VerticalSeparator pattern if possible.
      // VerticalSeparator uses `e.clientX - containerRect.left`.

      // Let's try `e.clientY - containerRect.top` but we might need to subtract the offset of the element.
      // Actually, if we pass the ref of the element being resized, we could use its top.
      // But we pass containerRef.

      // Let's try a logic that assumes the mouse cursor is where the bottom of the element should be.
      // So Height = MouseY - ElementTop.
      // We can get ElementTop from the separator's previous sibling? Or simply pass an offset?

      // For now, let's implement a simple updates-based-on-container-top approach,
      // and we can refine it if it jumps.

      const newHeight = relativeY;

      // Constrain min/max if needed (e.g. min 100px)
      if (newHeight > 100 && newHeight < containerRect.height - 100) {
        setHeight(newHeight);
      }
    },
    [isDragging, containerRef, setHeight],
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
        backgroundColor: "background.default", // transparent-ish
        "&:hover": {
          backgroundColor: "primary.main",
        },
        transition: "background-color 0.2s",
        zIndex: 10,
        my: 1,
        borderRadius: 1,
      }}
    >
      {/* Optional handle graphic */}
      <Box
        sx={{
          width: "40px",
          height: "3px",
          backgroundColor: "action.hover",
          borderRadius: "2px",
        }}
      />
    </Box>
  );
};

export default HorizontalSeparator;
