import { useState, useRef } from "react";
import AutoUpdateModal from "./components/AutoUpdateModal";
import FileExplorer from "./components/FileExplorer";
import FilePreview from "./components/FilePreview";
import { Providers } from "./components/Providers";
import VerticalSeparator from "./components/VerticalSeparator";
import { InstructionsInput } from "./components/InstructionsInput";
import TemplateSelection from "./components/TemplateSelection";
import { PlanInput } from "./components/PlanInput";
import { PlanPreview } from "./components/PlanPreview";
import { SelectedFiles } from "./components/SelectedFiles";
import ModeButtons from "./components/ModeButtons";
import ActionButtons from "./components/ActionButtons";
import ChatInterface from "./components/ChatInterface";
import HorizontalSeparator from "./components/HorizontalSeparator";
import { useUserContext } from "./context/UserContext";
import { useAppContext } from "./context/AppContext";
import "./App.css";

function AppContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [explorerWidth, setExplorerWidth] = useState(300);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedFilesHeight, setSelectedFilesHeight] = useState(250);
  const [isHorizontalCollapsed, setIsHorizontalCollapsed] = useState(false);
  const { formatOutput, apiMode } = useUserContext();
  const { selectedFiles } = useAppContext();

  const isChatMode = !formatOutput && apiMode;
  const showSelectedFiles = !isChatMode || selectedFiles.length > 0;

  const effectiveWidth = isCollapsed ? 60 : explorerWidth;
  const effectiveSelectedFilesHeight = isHorizontalCollapsed
    ? "40px"
    : isChatMode
      ? `${selectedFilesHeight}px`
      : "auto";

  return (
    <>
      <div
        ref={containerRef}
        className={`app-container ${isResizing ? "resizing" : ""}`}
        style={
          { "--explorer-width": `${effectiveWidth}px` } as React.CSSProperties
        }
      >
        {/* Left Panel */}
        <div className={`left-panel ${isCollapsed ? "collapsed" : ""}`}>
          <FileExplorer isCollapsed={isCollapsed} />
        </div>
        <VerticalSeparator
          containerRef={containerRef}
          setExplorerWidth={setExplorerWidth}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          setIsResizing={setIsResizing}
        />
        {/* Right Panel */}
        <div ref={rightPanelRef} className="right-panel">
          {formatOutput && <ModeButtons />}
          {!isChatMode && !apiMode && <PlanInput />}

          {showSelectedFiles && (
            <div
              style={{
                height: effectiveSelectedFilesHeight,
                overflow: isHorizontalCollapsed ? "hidden" : "auto",
                flexShrink: 0,
              }}
            >
              <SelectedFiles isCollapsed={isHorizontalCollapsed} />
            </div>
          )}

          {!isChatMode && <PlanPreview />}

          {/* Chat section */}
          {isChatMode && (
            <>
              {selectedFiles.length > 0 && (
                <HorizontalSeparator
                  containerRef={rightPanelRef}
                  setHeight={setSelectedFilesHeight}
                  isCollapsed={isHorizontalCollapsed}
                  setIsCollapsed={setIsHorizontalCollapsed}
                />
              )}
              <ChatInterface />
            </>
          )}
          <TemplateSelection />
          <InstructionsInput />
          <ActionButtons />
        </div>
      </div>
      <FilePreview />
      <AutoUpdateModal />
    </>
  );
}

function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
}
export default App;
