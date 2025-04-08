import { useState, useEffect, useCallback } from "react";
import { BaseDirectory, readDir } from "@tauri-apps/plugin-fs";
import { open as openDialog } from "@tauri-apps/plugin-dialog";

import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import SearchFiles from "./SearchFiles";
import SettingsMenu from "./SettingsMenu";
import DirectoryView from "./DirectoryView";
import { FolderSpecial, Delete, DragIndicator } from "@mui/icons-material";
import type { FileExplorerProps, TreeItemData } from "../types";
import { motion, Reorder } from "framer-motion";

export default function FileExplorer({
  onFilePreviewClick,
  onFileSelect,
  onThemeChange,
  projects,
  setProjects,
}: FileExplorerProps) {
  const theme = useTheme();
  const [showDotfiles, setShowDotfiles] = useState(false);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");

  const accordionVariants = {
    open: { height: "auto", opacity: 1, transition: { duration: 0.3 } },
    collapsed: { height: 0, opacity: 0, transition: { duration: 0.3 } },
  };

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
  const loadChildren = useCallback(
    async (node: TreeItemData) => {
      if (!node.isDirectory) return;
      const options: { baseDir?: number } = {};
      if (node.path === ".") {
        options.baseDir = BaseDirectory.Home;
      }
      const contents = await readDir(node.path, options);
      let entries = contents.map((entry) => ({
        id: node.path === "." ? entry.name || "" : `${node.path}/${entry.name}`,
        name: entry.name || "",
        path:
          node.path === "." ? entry.name || "" : `${node.path}/${entry.name}`,
        isDirectory: !!entry.isDirectory,
        children: [],
        loadedChildren: false,
      }));
      if (!showDotfiles) {
        entries = entries.filter((entry) => !entry.name.startsWith("."));
      }
      entries.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      node.children = entries;
      node.loadedChildren = true;
      setProjects((prev) => [...prev]);
    },
    [showDotfiles, setProjects]
  );

  // Called when we want to add a new project
  const openProject = async () => {
    const selected = await openDialog({
      directory: true,
      multiple: false,
    });
    if (selected && typeof selected === "string") {
      // Create the new root node and add it
      const newRoot = createRootNode(selected);
      setProjects((prev) => [...prev, newRoot]);
      // default expanded state is true
      setExpanded((prev) => ({ ...prev, [newRoot.path]: true }));
    }
  };

  // Remove a project by path
  function removeProject(path: string) {
    setProjects((prev) => prev.filter((proj) => proj.path !== path));
    setExpanded((prev) => {
      const newState = { ...prev };
      delete newState[path];
      return newState;
    });
  }

  // If user toggles dotfiles, re-load all projects
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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
  }, [loadChildren, projects]);

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
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <img src="/logo.png" alt="Logo" style={{ height: "55px" }} />
        </Box>
        <Button
          startIcon={<FolderSpecial />}
          variant="contained"
          onClick={openProject}
          fullWidth
        >
          {buttonLabel}
        </Button>
        <SearchFiles
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: "auto", overflowX: "auto", p: 1 }}>
        {projects.length === 0 ? (
          <Typography variant="body1">
            Load a project and choose which files will add context to your
            prompt.
          </Typography>
        ) : (
          <Reorder.Group
            as="div"
            axis="y"
            values={projects}
            onReorder={setProjects}
          >
            {projects.map((root) => (
              <Reorder.Item key={root.path} value={root}>
                <Box
                  sx={{
                    mb: 3,
                    border: "1px solid #ccc",
                    borderRadius: 1,
                    overflow: "hidden",
                  }}
                >
                  {/* Header with project name on left and drag icon + delete on right */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: theme.palette.secondary.main,
                      px: 1,
                      py: 0.5,
                      justifyContent: "space-between",
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    <Typography
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [root.path]: prev[root.path] === false,
                        }))
                      }
                      sx={{ cursor: "pointer", width: "100%" }}
                    >
                      {root.name}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {/* Drag icon */}
                      <Box
                        onMouseDown={(e) => {
                          // Prevent toggling accordion while dragging
                          e.stopPropagation();
                        }}
                        sx={{ cursor: "grab" }}
                      >
                        <DragIndicator fontSize="inherit" />
                      </Box>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          removeProject(root.path);
                        }}
                        size="small"
                      >
                        <Delete fontSize="inherit" />
                      </IconButton>
                    </Box>
                  </Box>
                  {/* Animated Directory tree */}
                  <motion.div
                    initial={
                      expanded[root.path] !== false ? "open" : "collapsed"
                    }
                    animate={
                      expanded[root.path] !== false ? "open" : "collapsed"
                    }
                    variants={accordionVariants}
                    style={{ overflow: "hidden" }}
                  >
                    <Box
                      sx={{
                        p: 1,
                        maxHeight: 300,
                        overflowY: "auto",
                        overscrollBehavior: "contain",
                      }}
                    >
                      <DirectoryView
                        node={root}
                        onFilePreviewClick={onFilePreviewClick}
                        onFileSelect={(file) =>
                          onFileSelect({ ...file, projectRoot: root.path })
                        }
                        showDotfiles={showDotfiles}
                        loadChildren={loadChildren}
                        searchQuery={searchQuery}
                      />
                    </Box>
                  </motion.div>
                </Box>
              </Reorder.Item>
            ))}
          </Reorder.Group>
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
