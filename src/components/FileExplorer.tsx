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
  useTheme,
} from "@mui/material";
import SettingsMenu from "./SettingsMenu";
import DirectoryView from "./DirectoryView";
import { FolderSpecial, Settings, Delete } from "@mui/icons-material";
import type { FileExplorerProps, TreeItemData } from "../types";

export default function FileExplorer({
  onFileSelect,
  onThemeChange,
  projects,
  setProjects,
}: FileExplorerProps) {
  const theme = useTheme();
  const [showDotfiles, setShowDotfiles] = useState(false);

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

  // If user toggles dotfiles, re-load all projects
  useEffect(() => {
    setProjects((prev) =>
      prev.map((root) => ({
        ...root,
        children: [],
        loadedChildren: false,
      }))
    );
  }, [showDotfiles, setProjects]);

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
            Load a project and choose which files will add context to your
            prompt.
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
                  backgroundColor: theme.palette.secondary.main,
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
                  onFileSelect={(file) =>
                    onFileSelect({ ...file, projectRoot: root.path })
                  }
                  showDotfiles={showDotfiles}
                  loadChildren={loadChildren}
                />
              </Box>
            </Box>
          ))
        )}
      </Box>
      <Box sx={{ p: 1, display: "flex", justifyContent: "flex-start" }}>
        <SettingsMenu
          showDotfiles={showDotfiles}
          setShowDotfiles={setShowDotfiles}
          onThemeChange={onThemeChange}
        />
      </Box>
    </Box>
  );
}
