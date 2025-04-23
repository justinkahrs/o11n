import { useState, useRef } from "react";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://670f41ff6f2403d4838ea67a695f3791@o4509202782683136.ingest.us.sentry.io/4509202784649216",
  release: `o11n@${process.env.npm_package_version}`,
});

import { Grid, CircularProgress, useTheme, Box } from "@mui/material";
import FileExplorer from "./components/FileExplorer";
import FilePreview from "./components/FilePreview";
import { useUserContext } from "./context/UserContext";
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
  const theme = useTheme();

  function LoaderOverlay() {
    const { loading } = useUserContext();
    if (!loading) return null;
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: theme.palette.primary.main,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        <CircularProgress />
      </div>
    );
  }

  return (
    <Providers>
      <Grid
        ref={containerRef}
        style={{ display: "flex", height: "100vh", padding: "16px" }}
      >
        {/* Left Panel: file explorer scrolls, settings fixed at bottom */}
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
          {/* Settings button aligned with explorer content */}
          <Box sx={{ alignSelf: "flex-start" }}>
            <SettingsMenu />
          </Box>
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
      <FilePreview />
      <LoaderOverlay />
    </Providers>
  );
}
export default App;
