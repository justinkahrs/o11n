import { useState, useRef } from "react";
import { Grid, Box } from "@mui/material";
import AutoUpdateModal from "./components/AutoUpdateModal";
import FileExplorer from "./components/FileExplorer";
import FilePreview from "./components/FilePreview";
import { Providers } from "./components/Providers";
import SettingsMenu from "./components/SettingsMenu";
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
  const [selectedFilesHeight, setSelectedFilesHeight] = useState(200);
  const { formatOutput, apiMode } = useUserContext();
  const { selectedFiles } = useAppContext();

  const isChatMode = !formatOutput && apiMode;
  const showSelectedFiles = !isChatMode || selectedFiles.length > 0;

  return (
    <>
      <Grid
        ref={containerRef}
        style={{ display: "flex", height: "100vh", padding: "16px" }}
      >
        {/* Left Panel */}
        <Grid
          style={{
            width: explorerWidth,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <div style={{ flexGrow: 1, overflow: "auto" }}>
            <FileExplorer />
          </div>
          <Box sx={{ alignSelf: "flex-start" }}>
            <SettingsMenu />
          </Box>
        </Grid>
        <VerticalSeparator
          containerRef={containerRef}
          setExplorerWidth={setExplorerWidth}
        />
        {/* Right Panel */}
        <Grid
          ref={rightPanelRef}
          sx={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            height: "100%",
            minWidth: 0,
          }}
          justifyContent="flex-start"
        >
          {!isChatMode && <ModeButtons />}
          {!isChatMode && <PlanInput />}

          {showSelectedFiles && (
            <Box
              sx={{
                height: isChatMode ? selectedFilesHeight : "auto",
                overflow: "auto",
                flexShrink: 0,
              }}
            >
              <SelectedFiles />
            </Box>
          )}

          {!isChatMode && <PlanPreview />}

          {/* Chat section */}
          {isChatMode && (
            <>
              {selectedFiles.length > 0 && (
                <HorizontalSeparator
                  containerRef={rightPanelRef}
                  setHeight={setSelectedFilesHeight}
                />
              )}
              <ChatInterface />
            </>
          )}
          <TemplateSelection />
          <InstructionsInput />
          <ActionButtons />
        </Grid>
      </Grid>
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
