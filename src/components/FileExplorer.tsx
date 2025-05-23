import { useState, useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
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
import useShortcut from "../utils/useShortcut";
import { platform } from "@tauri-apps/plugin-os";
import { KeyboardCommandKey } from "@mui/icons-material";
import { Grid } from "@mui/material";
import { useFS } from "../api/fs";
// Add imports for file metadata and token counting
import { stat, BaseDirectory } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { isImage } from "../utils/image";

export default function FileExplorer() {
  const theme = useTheme();
  const { getChildren, watch, searchConfigFiles } = useFS();
  const { showDotfiles, showLogo, showShortcuts, useIgnoreFiles, countTokens } =
    useUserContext();
  useShortcut("o", () => openProject(), { ctrlKey: true, metaKey: true });
  const {
    handleFileSelect,
    handleFilePreviewClick,
    projects,
    setProjects,
    setConfigFiles,
  } = useAppContext();
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: need this so it refreshes on flag changes
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
    [getChildren, showDotfiles, useIgnoreFiles, setProjects]
  ); // Called when we want to create a new file
  const newFile = async () => {
    const defaultDir = projects[0]?.path;
    const selected = await open({
      defaultPath: defaultDir,
      multiple: false,
      directory: false,
    });
    if (selected && typeof selected === "string") {
      // Normalise for reliable prefix checks on every OS
      const normalizePath = (p: string) => p.replaceAll("\\", "/");
      const normalizedSelected = normalizePath(selected);
      // Try to locate an existing project that contains this file
      let matchingRoot = projects.find((proj) => {
        const projPath = normalizePath(proj.path);
        return (
          normalizedSelected === projPath ||
          normalizedSelected.startsWith(`${projPath}/`)
        );
      })?.path;
      // If no project matches, create a new one rooted at the file's directory
      if (!matchingRoot) {
        const dir = normalizedSelected.substring(
          0,
          normalizedSelected.lastIndexOf("/")
        );
        const newRoot = createRootNode(dir);
        setProjects((prev) => [...prev, newRoot]);
        setExpanded((prev) => ({ ...prev, [newRoot.path]: true }));
        await watch(dir);
        const configs = await searchConfigFiles(dir);
        setConfigFiles(configs);
        matchingRoot = dir;
      }
      const name = normalizedSelected.split("/").pop() || normalizedSelected; // Compute file size in MB
      const metadata = await stat(selected, { baseDir: BaseDirectory.Home });
      const size = metadata.size / (1024 * 1024);
      const fileNode: any = { id: name, name, path: selected, size };
      // Compute token size if applicable
      if (countTokens && !isImage(name)) {
        const tokenCount = await invoke("count_tokens_path", {
          path: selected,
        });
        fileNode.tokenSize = Number(tokenCount);
      }
      // Attach the file to the correct (or newly-created) project
      handleFileSelect({ ...fileNode, projectRoot: matchingRoot }); // Immediately open the preview modal for editing
      handleFilePreviewClick(undefined as any, fileNode);
    }
  }; // Called when we want to add a new project
  const openProject = async () => {
    const selected = await open({
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
      const configs = await searchConfigFiles(selected);
      setConfigFiles(configs);
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
  }, [showDotfiles, useIgnoreFiles, setProjects]);

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
  useEffect(() => {
    (async () => {
      const allConfigs = await Promise.all(
        projects.map((proj) => searchConfigFiles(proj.path))
      );
      setConfigFiles(allConfigs.flat());
    })();
  }, [projects, setConfigFiles, searchConfigFiles]);

  const buttonLabel = showShortcuts ? (
    platform() === "macos" ? (
      <Grid container spacing={1}>
        <Grid item>Load Project</Grid>
        <Grid item>
          (
          <KeyboardCommandKey sx={{ paddingTop: "2px", fontSize: "14px" }} /> +
          o)
        </Grid>
      </Grid>
    ) : (
      <>Load Project (Ctrl + O)</>
    )
  ) : (
    "Load Project"
  );

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
          onClick={newFile} // to-do actually make a new file
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
                      disabled={!!searchQuery}
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
                    isActive={
                      searchQuery ? index === activeSearchProjectIndex : false
                    }
                    onMoveNext={() =>
                      setActiveSearchProjectIndex((prev) =>
                        prev + 1 < projects.length ? prev + 1 : 0
                      )
                    }
                    onMovePrev={() =>
                      setActiveSearchProjectIndex(
                        (prev) => (prev - 1 + projects.length) % projects.length
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
