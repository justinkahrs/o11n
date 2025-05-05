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
import "./App.css";
function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [explorerWidth, setExplorerWidth] = useState(300);

  return (
    <Providers>
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
          sx={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            height: "100%",
          }}
          justifyContent="flex-start"
        >
          <ModeButtons />
          <InstructionsInput />
          <TemplateSelection />
          <PlanInput />
          <PlanPreview />
          <SelectedFiles />
          <ActionButtons />
        </Grid>
      </Grid>
      <FilePreview />
      <AutoUpdateModal />
    </Providers>
  );
}
export default App;
