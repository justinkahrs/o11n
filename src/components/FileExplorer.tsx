import { useState, useEffect } from "react";
import { BaseDirectory, readDir } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";

import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import DirectoryView from "./DirectoryView";
import { FolderSpecial, Settings, Delete } from "@mui/icons-material";

interface TreeItemData {
  id: string;
  name: string;
  path: string; // This may be '.' or a full path
  isDirectory: boolean;
  children: TreeItemData[];
  loadedChildren: boolean;
}

interface FileExplorerProps {
  onFileSelect: (file: {
    id: string;
    name: string;
    path: string;
    size: number;
  }) => void;
}

export default function FileExplorer({ onFileSelect }: FileExplorerProps) {
  const [showDotfiles, setShowDotfiles] = useState(false);
  // We remove the gitignore usage for now, or keep it commented out or hidden
  // For demonstration, let's keep it out of the UI
  // const [useGitignore, setUseGitignore] = useState(true);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // We can store an array of "projects" (root nodes)
  const [projects, setProjects] = useState<TreeItemData[]>([]);

  // Helper to create a new project node
  function createRootNode(dirPath: string): TreeItemData {
    const parts = dirPath.split(/[\\/]/);
    const dirName = parts[parts.length - 1] || dirPath;
    return {
      id: dirName,
      name: dirName,
      path: dirPath,
      isDirectory: true,
      children: [],
      loadedChildren: false,
    };
  }

  // Load the children for a directory node if not already loaded
  async function loadChildren(node: TreeItemData) {
    if (!node.isDirectory) return;
    let options: any = {};
    if (node.path === ".") {
      options.baseDir = BaseDirectory.Home;
    }

    const contents = await readDir(node.path, options);

    let entries = contents.map((entry) => ({
      id: node.path === "." ? entry.name || "" : `${node.path}/${entry.name}`,
      name: entry.name || "",
      path: node.path === "." ? entry.name || "" : `${node.path}/${entry.name}`,
      isDirectory: !!entry.isDirectory,
      children: [],
      loadedChildren: false,
    }));

    // Filter out dotfiles if showDotfiles is false
    if (!showDotfiles) {
      entries = entries.filter((entry) => !entry.name.startsWith("."));
    }

    // Sort: directories first, then files
    entries.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    node.children = entries;
    node.loadedChildren = true;

    // Force a re-render by updating the array
    setProjects((prev) => [...prev]);
  }

  // Called when we want to add a new project
  const openProject = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    if (selected && typeof selected === "string") {
      // Create the new root node and add it
      const newRoot = createRootNode(selected);
      setProjects((prev) => [...prev, newRoot]);
    }
  };

  // Remove a project by path
  function removeProject(path: string) {
    setProjects((prev) => prev.filter((proj) => proj.path !== path));
  }

  // Handlers for settings menu
  const handleSettingsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setAnchorEl(null);
  };

  // If user toggles dotfiles, re-load all projects
  useEffect(() => {
    setProjects((prev) =>
      prev.map((root) => ({
        ...root,
        children: [],
        loadedChildren: false,
      }))
    );
  }, [showDotfiles]);

  // If a root hasn't loaded children, load them
  useEffect(() => {
    (async () => {
      for (const proj of projects) {
        if (!proj.loadedChildren && proj.isDirectory) {
          await loadChildren(proj);
        }
      }
    })();
  }, [projects]);

  const buttonLabel =
    projects.length > 0 ? "Load Another Project" : "Load Project";

  return (
    <Box
      sx={{
        minWidth: "30%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ p: 1 }}>
        <Button
          startIcon={<FolderSpecial />}
          variant="contained"
          onClick={openProject}
          fullWidth
        >
          {buttonLabel}
        </Button>
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: "auto", overflowX: "auto", p: 1 }}>
        {projects.length === 0 ? (
          <Typography variant="body1">
            Load a project and choose which files will add context.
          </Typography>
        ) : (
          projects.map((root) => (
            <Box
              key={root.path}
              sx={{
                mb: 3,
                border: "1px solid #ccc",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              {/* Header with project name + delete */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#f5f5f5",
                  px: 1,
                  py: 0.5,
                  justifyContent: "space-between",
                }}
              >
                <Typography>{root.name}</Typography>
                <IconButton
                  onClick={() => removeProject(root.path)}
                  size="small"
                >
                  <Delete fontSize="inherit" />
                </IconButton>
              </Box>
              {/* Directory tree */}
              <Box sx={{ p: 1 }}>
                <DirectoryView
                  node={root}
                  onFileSelect={onFileSelect}
                  showDotfiles={showDotfiles}
                  loadChildren={loadChildren}
                />
              </Box>
            </Box>
          ))
        )}
      </Box>
      <Box sx={{ p: 1, display: "flex", justifyContent: "flex-start" }}>
        <IconButton onClick={handleSettingsOpen}>
          <Settings />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleSettingsClose}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
        >
          <MenuItem>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showDotfiles}
                  onChange={(e) => setShowDotfiles(e.target.checked)}
                />
              }
              label="Show .dotfiles"
            />
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
