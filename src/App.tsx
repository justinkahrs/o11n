import { useState } from "react";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import FileExplorer from "./components/FileExplorer";
import { InstructionsInput } from "./components/InstructionsInput";
import { SelectedFiles, FileNode } from "./components/SelectedFiles";
import { theme } from "./theme";

function App() {
  const [instructions, setInstructions] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileNode[]>([]);
  function handleFileSelect(file: FileNode) {
    setSelectedFiles((prev) => [...prev, file]);
  }

  function handleRemoveFile(fileId: string) {
    setSelectedFiles(prev => prev.filter(file => file.id !== fileId));
  }

  function handleRemoveFolder(folderPath: string) {
    setSelectedFiles(prev => prev.filter(file => {
      const lastSlash = file.path.lastIndexOf('/');
      const fileFolder = lastSlash !== -1 ? file.path.substring(0, lastSlash) : 'Root';
      return fileFolder !== folderPath;
    }));
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box display="flex">
        <FileExplorer onFileSelect={handleFileSelect} />
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100vh",
          }}
        >
          <InstructionsInput onChange={setInstructions} />
          <SelectedFiles
            files={selectedFiles}
            onRemoveFile={handleRemoveFile}
            onRemoveFolder={handleRemoveFolder}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;