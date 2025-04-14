import { useEffect, useState, type RefObject } from "react";
interface VerticalSeparatorProps {
  containerRef: RefObject<HTMLDivElement>;
  setExplorerWidth: React.Dispatch<React.SetStateAction<number>>;
}
const VerticalSeparator = ({
  containerRef,
  setExplorerWidth,
}: VerticalSeparatorProps) => {
  const [isDragging, setIsDragging] = useState(false);
  // Handle mouse move events to update explorerWidth when dragging.
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      let newWidth = e.clientX - containerRect.left;
      // Set minimum width of 100px and a maximum width based on container size.
      const maxWidth = containerRect.width - 100;
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
  }, [containerRef, setExplorerWidth, isDragging]);
  return (
    <div
      onMouseDown={() => setIsDragging(true)}
      style={{
        width: "5px",
        flexShrink: 0,
        cursor: "col-resize",
        backgroundColor: "rgba(0,0,0,0.1)",
        margin: "0 8px",
      }}
    />
  );
};
export default VerticalSeparator;
