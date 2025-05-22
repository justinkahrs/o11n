import { useState, useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { Box, IconButton, Typography, useTheme, Tooltip } from "@mui/material";
import {
  Folder,
  FolderSpecial,
  Delete,
  InsertDriveFile,
} from "@mui/icons-material";
import type { TreeItemData } from "../types";
import { AccordionItem } from "./AccordionItem";
import DirectoryView from "./DirectoryView";
import LogoSVG from "./LogoSVG";
import SearchFiles from "./SearchFiles";
import RetroButton from "./RetroButton";
import { useAppContext } from "../context/AppContext";
import { useUserContext } from "../context/UserContext";
import { useFS } from "../api/fs";

export default function FileExplorer() {
  const theme = useTheme();
  const { getChildren, watch } = useFS();
  const { showDotfiles, showLogo } = useUserContext();
  const { handleFileSelect, handleFilePreviewClick, projects, setProjects } =
    useAppContext();
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");
const [activeSearchProjectIndex, setActiveSearchProjectIndex] = useState(0);
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
      try {
        const entries = await getChildren(node.path, showDotfiles);
        node.children = entries.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        }) as TreeItemData[]; // TO-DO sort on backend
        node.loadedChildren = true;
        setProjects((prev) => [...prev]);
      } catch (error) {
        console.error("Failed to read directory", node.path, error);
        return;
      }
    },
    [getChildren, showDotfiles, setProjects]
  );

  // Called when we want to open a single file
  const openFile = async () => {
    const selected = await openDialog({
      multiple: false,
      directory: false,
    });
    if (selected && typeof selected === "string") {
      const path = selected;
      const name = path.split("/").pop() || path;
      handleFileSelect({ id: name, name, path });
    }
  };
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
      await watch(selected);
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

// Reset active search project when the query changes
  useEffect(() => {
    if (searchQuery) {
      setActiveSearchProjectIndex(0);
    }
  }, [searchQuery]);
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

  // Watch for filesystem updates emitted by Rust
  useEffect(() => {
    const unlistenPromise = listen<string[]>("fs_change", () => {
      setProjects((prev) =>
        prev.map((proj) => ({ ...proj, children: [], loadedChildren: false }))
      );
    });
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [setProjects]);

  const buttonLabel = "Load Project";

  return (
    <Box
      sx={{
        minWidth: "30%",
        height: "95%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ p: 1 }}>
        <Box sx={{ textAlign: "center", mb: 2 }}>{showLogo && <LogoSVG />}</Box>
        <RetroButton
          fullWidth
          onClick={openProject}
          startIcon={<FolderSpecial />}
          sx={{ height: 40, mb: 1 }}
        >
          {buttonLabel}
        </RetroButton>
        <RetroButton
          fullWidth
          onClick={openFile}
          startIcon={<InsertDriveFile />}
          sx={{ height: 40, mt: 1 }}
          variant="outlined"
        >
          Load File
        </RetroButton>
        <SearchFiles
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: "auto", overflowX: "auto", p: 1 }}>
        {projects.length === 0 ? (
          <Typography color="primary" variant="body1">
            Load a project and select files to add context to your prompt.
          </Typography>
) : (
          projects.map((project, index) => (
            <Box
              key={project.path}
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
                      [project.path]: prev[project.path] === false,
                    }))
                  }
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  <Folder
                    className="file-icon"
                    fontSize="small"
                    sx={{ mr: 1 }}
                  />

                  {project.name}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Tooltip
                    arrow
                    disableInteractive
                    enterDelay={500}
                    title="Remove project"
                  >
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        removeProject(project.path);
                      }}
                      size="small"
                    >
                      <Delete fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              {/* Animated Directory tree */}
              <AccordionItem isOpen={expanded[project.path] !== false}>
                <Box
                  sx={{
                    p: 1,
                    // maxHeight: 400,
                    overflowY: "auto",
                  }}
                >
<DirectoryView
                    node={project}
                    onPreviewFile={handleFilePreviewClick}
                    onFileSelect={(file) =>
                      handleFileSelect({ ...file, projectRoot: project.path })
                    }
                    loadChildren={loadChildren}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    isActive={searchQuery ? index === activeSearchProjectIndex : false}
                    onMoveNext={() =>
                      setActiveSearchProjectIndex((prev) =>
                        prev + 1 < projects.length ? prev + 1 : 0
                      )
                    }
                    onMovePrev={() =>
                      setActiveSearchProjectIndex((prev) =>
                        (prev - 1 + projects.length) % projects.length
                      )
                    }
                  />
                </Box>
              </AccordionItem>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
