import { useState, useRef } from "react";
import { Grid } from "@mui/material";
import FileExplorer from "./components/FileExplorer";
import FilePreviewModal from "./components/FilePreviewModal";
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
        <Grid style={{ width: explorerWidth, overflow: "auto", flexShrink: 0 }}>
          <FileExplorer />
          <SettingsMenu />
        </Grid>
        <VerticalSeparator
          containerRef={containerRef}
          setExplorerWidth={setExplorerWidth}
        />
        {/* Right Panel*/}
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
      <FilePreviewModal />
    </Providers>
  );
}
export default App;
