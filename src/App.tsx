import { useState, useEffect, useRef } from "react";
import {
  ThemeProvider,
  CssBaseline,
  Stack,
  Grid,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Modal,
  Box,
  CircularProgress,
} from "@mui/material";
import type { PaletteMode } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import FileExplorer from "./components/FileExplorer";
import FilePreview from "./components/FilePreview";
import { InstructionsInput } from "./components/InstructionsInput";
import { SelectedFiles } from "./components/SelectedFiles";
import Copy from "./components/Copy";
import TemplateSelection from "./components/TemplateSelection";
import { PlanInput } from "./components/PlanInput";
import { theme as defaultTheme } from "./theme";
import { createTheme } from "@mui/material/styles";
import "./App.css";
// Import our shared types
import type { FileNode, TreeItemData } from "./types";
import { Create } from "@mui/icons-material";
import { PlanPreview } from "./components/PlanPreview";
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
  const [plan, setPlan] = useState("");
  const [currentTheme, setCurrentTheme] = useState(defaultTheme);
  const [mode, setMode] = useState<"talk" | "plan" | "do">("plan");
  const [selectedFile, setSelectedFile] = useState<{
    id: string;
    name: string;
    path: string;
  } | null>(null);
  const [committing, setCommitting] = useState(false);
  // New state for adjustable FileExplorer width and dragging status.
  const [explorerWidth, setExplorerWidth] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef(projects);
  const selectedFilesRef = useRef(selectedFiles);
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);
  useEffect(() => {
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);
  // Handle mouse move events to update explorerWidth when dragging.
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      let newWidth = e.clientX - containerRect.left;
      // Set minimum width of 100px and a maximum width based on container size.
      const maxWidth = containerRect.width - 100;
      if (newWidth < 100) newWidth = 100;
      else if (newWidth > maxWidth) newWidth = maxWidth;
      setExplorerWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);
  const handleFilePreviewClick = (
    _event: React.SyntheticEvent<HTMLElement>,
    file: { id: string; name: string; path: string } | null
  ) => {
    // If the same file is clicked again, toggle off the preview.
    if (selectedFile && file && selectedFile.id === file.id) {
      setSelectedFile(null);
    } else {
      setSelectedFile(file);
    }
    setMode("plan");
  };
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
  const handleCommit = async () => {
    setCommitting(true);
    try {
      const result = await invoke("apply_protocol", {
        xmlInput: plan,
      });
      console.log("Success:", result);
    } catch (error) {
      console.error("Failed to apply changes:", error);
    }
    setCommitting(false);
    setProjects((prev) =>
      prev.map((proj) => ({ ...proj, loadedChildren: false }))
    );
    if (plan.includes("### File") && plan.includes("### Action create")) {
      try {
        const regex =
          /### File\s+([^\n]+)[\s\S]+?### Action create[\s\S]+?\*\*Content\*\*:\s*\n\s*```(?:\w+)?\n([\s\S]*?)```/gi;
        const newFiles: FileNode[] = [];
        let match;
        while ((match = regex.exec(plan)) !== null) {
          const filePath = match[1].trim();
          // Check for duplicate files based on file path
          if (selectedFiles.some((f) => f.path === filePath)) {
            continue;
          }
          const fileContent = match[2];
          // Calculate size in MB similarly to DirectoryView using TextEncoder
          const sizeInBytes = new TextEncoder().encode(fileContent).length;
          const size = sizeInBytes / (1024 * 1024);
          const parts = filePath.split("/");
          const fileName = parts[parts.length - 1] || "New File";
          newFiles.push({ id: filePath, name: fileName, path: filePath, size });
        }
        if (newFiles.length > 0) {
          setSelectedFiles((prev) => [...prev, ...newFiles]);
        }
      } catch (e) {
        console.error(
          "Error parsing new file creation instructions from markdown",
          e
        );
      }
    }
    setMode("plan");
    setPlan("");
  };

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <div
        ref={containerRef}
        style={{ display: "flex", height: "100vh", padding: "16px" }}
      >
        {/* Left Panel: FileExplorer wrapped in a fixed-width container */}
        <div style={{ width: explorerWidth, overflow: "auto", flexShrink: 0 }}>
          <FileExplorer
            onFileSelect={handleFileSelect}
            onFilePreviewClick={handleFilePreviewClick}
            projects={projects}
            setProjects={setProjects}
            onThemeChange={(primary, secondary, themeMode) => {
              setCurrentTheme(
                createTheme({
                  typography: defaultTheme.typography,
                  palette: {
                    mode: themeMode as PaletteMode,
                    primary: { main: primary },
                    secondary: { main: secondary },
                  },
                })
              );
            }}
          />
        </div>
        {/* Divider: Draggable vertical separator */}
        <div
          onMouseDown={() => setIsDragging(true)}
          style={{
            width: "5px",
            cursor: "col-resize",
            backgroundColor: "rgba(0,0,0,0.1)",
            margin: "0 8px",
          }}
        />
        {/* Right Panel: Grid that grows to fill the remaining space */}
        <div style={{ flexGrow: 1 }}>
          <Grid
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
            justifyContent="space-between"
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
              <>
                <ToggleButtonGroup
                  color="primary"
                  value={mode}
                  exclusive
                  onChange={(_e, newMode) => {
                    if (newMode !== null) setMode(newMode);
                  }}
                  sx={{ m: 2 }}
                >
                  <ToggleButton size="small" value="plan">
                    Let's plan
                  </ToggleButton>
                  <ToggleButton size="small" value="do">
                    Let's do it
                  </ToggleButton>
                </ToggleButtonGroup>
                {mode !== "do" && (
                  <InstructionsInput mode={mode} onChange={setInstructions} />
                )}
                <TemplateSelection
                  mode={mode}
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
                <PlanInput mode={mode} plan={plan} onChange={setPlan} />
                <PlanPreview mode={mode} plan={plan} />
                <SelectedFiles
                  mode={mode}
                  plan={plan}
                  files={selectedFiles}
                  onRemoveFile={handleRemoveFile}
                  onRemoveFolder={handleRemoveFolder}
                  onPreviewFile={handleFilePreviewClick}
                />
              </>
            </Stack>
            <Stack
              direction="row"
              spacing={2}
              sx={{ mt: 2 }}
              justifyContent={mode === "do" ? "flex-end" : "space-between"}
            >
              {mode === "do" ? (
                <>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Create />}
                    sx={{
                      display: "none",
                      mt: 2,
                      width: "30%",
                    }} /* hiding for now */
                    // onClick={handleRevert}
                  >
                    Revert Changes
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={
                      committing ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <Create />
                      )
                    }
                    sx={{ mt: 2, width: "30%" }}
                    onClick={handleCommit}
                    disabled={committing}
                  >
                    {committing ? "Processing..." : "Commit Changes"}
                  </Button>
                </>
              ) : (
                <>
                  <Copy
                    files={selectedFiles}
                    userInstructions={instructions}
                    customTemplates={customTemplates}
                    isTalkMode={mode === "talk"}
                  />
                </>
              )}
            </Stack>
          </Grid>
        </div>
      </div>
      <Modal open={Boolean(selectedFile)} onClose={() => setSelectedFile(null)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            minWidth: "80%",
          }}
        >
          {selectedFile && <FilePreview file={selectedFile} />}
        </Box>
      </Modal>
    </ThemeProvider>
  );
}
export default App;
