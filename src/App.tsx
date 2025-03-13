import { useState } from "react";
import { ThemeProvider, CssBaseline, Stack, Grid } from "@mui/material";
import FileExplorer from "./components/FileExplorer";
import { InstructionsInput } from "./components/InstructionsInput";
import { SelectedFiles, type FileNode } from "./components/SelectedFiles";
import Copy from "./components/Copy";
import { theme } from "./theme";

function App() {
  const [instructions, setInstructions] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileNode[]>([]);
  function handleFileSelect(file: FileNode) {
    setSelectedFiles((prev) => {
      if (prev.some((f) => f.path === file.path)) {
        return prev;
      }
      return [...prev, file];
    });
  }

  function handleRemoveFile(fileId: string) {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== fileId));
  }

  function handleRemoveFolder(folderPath: string) {
    setSelectedFiles((prev) =>
      prev.filter((file) => {
        const lastSlash = file.path.lastIndexOf("/");
        const fileFolder =
          lastSlash !== -1 ? file.path.substring(0, lastSlash) : "Root";
        return fileFolder !== folderPath;
      })
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Stack
        sx={{ height: "100vh", p: 2 }}
        direction="row"
        // spacing={2}
        justifyContent="space-around"
      >
        <FileExplorer onFileSelect={handleFileSelect} />
        <Grid
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack
            sx={{
              width: "100%",
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
            alignContent="space-between"
          >
            <InstructionsInput onChange={setInstructions} />
            <SelectedFiles
              files={selectedFiles}
              onRemoveFile={handleRemoveFile}
              onRemoveFolder={handleRemoveFolder}
            />
          </Stack>
          <Copy files={selectedFiles} userInstructions={instructions} />
        </Grid>
      </Stack>
    </ThemeProvider>
  );
}

export default App;
