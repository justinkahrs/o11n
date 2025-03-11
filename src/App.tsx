import { useState } from "react";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { FileExplorer } from "./components/FileExplorer";
import { InstructionsInput } from "./components/InstructionsInput";
import { SelectedFiles } from "./components/SelectedFiles";
import { theme } from "./theme";

function App() {
  const [instructions, setInstructions] = useState("");
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box display="flex">
        <FileExplorer onSelectionChange={setSelectedPaths} />
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100vh",
          }}
        >
          <InstructionsInput onChange={setInstructions} />
          <SelectedFiles files={selectedPaths} />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
