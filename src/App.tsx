import { useState } from "react";
import { ThemeProvider, CssBaseline, Stack } from "@mui/material";
import FileExplorer from "./components/FileExplorer";
import { InstructionsInput } from "./components/InstructionsInput";
import { SelectedFiles, type FileNode } from "./components/SelectedFiles";
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
      <Stack direction="row">
        <FileExplorer onFileSelect={handleFileSelect} />
        <Stack sx={{ width: "100%" }}>
          <InstructionsInput onChange={setInstructions} />
          <SelectedFiles
            files={selectedFiles}
            onRemoveFile={handleRemoveFile}
            onRemoveFolder={handleRemoveFolder}
          />
        </Stack>
      </Stack>
    </ThemeProvider>
  );
}

export default App;
