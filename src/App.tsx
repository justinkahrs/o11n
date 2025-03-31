import { useState, useEffect, useRef } from "react";
import { ThemeProvider, CssBaseline, Stack, Grid, Button } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import FileExplorer from "./components/FileExplorer";
import { InstructionsInput } from "./components/InstructionsInput";
import { SelectedFiles } from "./components/SelectedFiles";
import Copy from "./components/Copy";
import TemplateSelection from "./components/TemplateSelection";
import { PlanInput } from "./components/PlanInput";
import { theme } from "./theme";

// Import our shared types
import type { FileNode, TreeItemData } from "./types";
import { ChevronLeft, Create } from "@mui/icons-material";

interface CustomTemplate {
  id: string;
  name: string;
  path: string;
  active: boolean;
}

function App() {
  const [instructions, setInstructions] = useState("");
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileNode[]>([]);
  const [projects, setProjects] = useState<TreeItemData[]>([]);
  const [planMode, setPlanMode] = useState(false);
  const [plan, setPlan] = useState("");

  const projectsRef = useRef(projects);
  const selectedFilesRef = useRef(selectedFiles);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);

  function handleFileSelect(file: FileNode) {
    setSelectedFiles((prev) => {
      if (prev.some((f) => f.path === file.path)) {
        return prev.filter((f) => f.path !== file.path);
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

  const handleApply = async () => {
    setPlanMode(true);
  };

  const handleCommit = async () => {
    try {
      const result = await invoke("apply_protocol", {
        xmlInput: plan,
        reverse: false,
      });
      console.log("Success:", result);
    } catch (error) {
      console.error("Failed to apply changes:", error);
    }
  };

  const handleRevert = async () => {
    try {
      const result = await invoke("apply_protocol", {
        xmlInput: plan,
        reverse: true,
      });
      console.log("Success:", result);
    } catch (error) {
      console.error("Failed to revert changes:", error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Stack
        sx={{ height: "100vh", p: 2 }}
        direction="row"
        justifyContent="space-around"
      >
        <FileExplorer
          onFileSelect={handleFileSelect}
          projects={projects}
          setProjects={setProjects}
        />
        <Grid
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
          justifyContent="space-between"
        >
          <>
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
              {planMode ? (
                <PlanInput plan={plan} onChange={setPlan} />
              ) : (
                <>
                  <InstructionsInput onChange={setInstructions} />
                  <TemplateSelection
                    templates={customTemplates}
                    onAddTemplate={(template) =>
                      setCustomTemplates((prev) => [...prev, template])
                    }
                    onRemoveTemplate={(id) =>
                      setCustomTemplates((prev) =>
                        prev.filter((t) => t.id !== id)
                      )
                    }
                    onToggleTemplate={(id) =>
                      setCustomTemplates((prev) =>
                        prev.map((t) =>
                          t.id === id ? { ...t, active: !t.active } : t
                        )
                      )
                    }
                  />
                  <SelectedFiles
                    files={selectedFiles}
                    onRemoveFile={handleRemoveFile}
                    onRemoveFolder={handleRemoveFolder}
                  />
                </>
              )}
            </Stack>
            <Stack
              direction="row"
              spacing={2}
              sx={{ mt: 2 }}
              justifyContent={planMode ? "flex-end" : "space-between"}
            >
              {planMode ? (
                <>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ChevronLeft />}
                    sx={{ mt: 2, width: "30%" }}
                    onClick={() => setPlanMode(false)}
                  >
                    Go back
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Create />}
                    sx={{ mt: 2, width: "30%" }}
                    onClick={handleCommit}
                  >
                    Commit Changes
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Create />}
                    sx={{ mt: 2, width: "30%" }}
                    onClick={handleRevert}
                  >
                    Revert Changes
                  </Button>
                </>
              ) : (
                <>
                  <Copy
                    files={selectedFiles}
                    userInstructions={instructions}
                    customTemplates={customTemplates}
                  />
                  <Button
                    fullWidth
                    startIcon={<Create />}
                    variant="outlined"
                    onClick={handleApply}
                    sx={{ width: "40%" }}
                  >
                    Apply Changes
                  </Button>
                </>
              )}
            </Stack>
          </>
        </Grid>
      </Stack>
    </ThemeProvider>
  );
}

export default App;
