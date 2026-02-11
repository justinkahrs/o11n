import { useState, useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { Box, IconButton, Typography, useTheme, Tooltip } from "@mui/material";
import {
  Folder,
  FolderSpecial,
  Delete,
  InsertDriveFile,
  NoteAdd,
  CreateNewFolder,
  AddBox,
} from "@mui/icons-material";
import type { TreeItemData } from "../types";
import { AccordionItem } from "./AccordionItem";
import DirectoryView from "./DirectoryView";
import LogoSVG from "./LogoSVG";
import SmallLogoSVG from "./SmallLogoSVG";
import SearchFiles from "./SearchFiles";
import RetroButton from "./RetroButton";
import { useAppContext } from "../context/AppContext";
import { useUserContext } from "../context/UserContext";
import useShortcut from "../utils/useShortcut";
import { platform } from "@tauri-apps/plugin-os";
import { KeyboardCommandKey } from "@mui/icons-material";
import { useFS } from "../api/fs";
// Add imports for file metadata and token counting
import { stat, BaseDirectory } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { isImage } from "../utils/image";
import CreateItemModal from "./CreateItemModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { writeTextFile, mkdir, remove } from "@tauri-apps/plugin-fs";
import SettingsMenu from "./SettingsMenu";
import NewProjectModal from "./NewProjectModal";

export default function FileExplorer({
  isCollapsed,
}: {
  isCollapsed?: boolean;
}) {
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
    setSelectedFiles,
    setSelectedFile,
  } = useAppContext();
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchProjectIndex, setActiveSearchProjectIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"file" | "folder">("file");
  const [newFileProjectBase, setNewFileProjectBase] = useState<string | null>(
    null,
  );
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: "file" | "folder";
    path: string;
    name: string;
    projectPath: string;
  }>({
    open: false,
    type: "file",
    path: "",
    name: "",
    projectPath: "",
  });

  const { highlightedPath } = useAppContext();
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
        const sortedEntries = entries.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        }) as TreeItemData[];

        const updateNodeInTree = (nodes: TreeItemData[]): TreeItemData[] => {
          return nodes.map((n) => {
            if (n.path === node.path) {
              return { ...n, children: sortedEntries, loadedChildren: true };
            }
            if (n.children && n.children.length > 0) {
              const updatedChildren = updateNodeInTree(n.children);
              // Only return a new object if children actually changed
              if (updatedChildren !== n.children) {
                return { ...n, children: updatedChildren };
              }
            }
            return n;
          });
        };

        setProjects((prev) => updateNodeInTree(prev));
      } catch (error) {
        console.error("Failed to read directory", node.path, error);
      }
    },
    [getChildren, showDotfiles, setProjects],
  );
  // Called when we want to create a new file
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
          normalizedSelected.lastIndexOf("/"),
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

  const handleNewProjectCreated = async (projectPath: string) => {
    const newRoot = createRootNode(projectPath);
    setProjects((prev) => [...prev, newRoot]);
    setExpanded((prev) => ({ ...prev, [newRoot.path]: true }));
    await watch(projectPath);
    const configs = await searchConfigFiles(projectPath);
    setConfigFiles(configs);
  };

  const handleNewItemOpen = (projectPath: string, type: "file" | "folder") => {
    setNewFileProjectBase(projectPath);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleCreateFile = async (filename: string) => {
    if (!newFileProjectBase) return;

    let targetDir = newFileProjectBase;
    if (highlightedPath && highlightedPath.startsWith(newFileProjectBase)) {
      // Check if highlightedPath is a directory or file
      // If it's a file, get its parent. If it's a directory, use it.
      try {
        const metadata = await stat(highlightedPath, {
          baseDir: BaseDirectory.Home,
        });
        if (metadata.isDirectory) {
          targetDir = highlightedPath;
        } else {
          targetDir = highlightedPath.substring(
            0,
            highlightedPath.lastIndexOf("/"),
          );
        }
      } catch (e) {
        console.error("Error checking highlighted path", e);
      }
    }

    const fullPath = `${targetDir}/${filename}`;
    try {
      await writeTextFile(fullPath, "", {
        baseDir: BaseDirectory.Home,
      });

      // Force a manual refresh of the project root to ensure the new file shows up.
      // We set loadedChildren to false recursively but keep the children array
      // so that DirectoryView instances stay mounted and preserve their expanded state.
      const invalidateTree = (nodes: TreeItemData[]): TreeItemData[] =>
        nodes.map((n) => ({
          ...n,
          loadedChildren: false,
          children: n.children ? invalidateTree(n.children) : [],
        }));

      setProjects((prev) =>
        prev.map((proj) =>
          proj.path === newFileProjectBase
            ? {
                ...proj,
                loadedChildren: false,
                children: invalidateTree(proj.children),
              }
            : proj,
        ),
      );

      const name = filename;
      const fileNode: any = { id: fullPath, name, path: fullPath, size: 0 };

      // Auto-select and open preview
      handleFileSelect({ ...fileNode, projectRoot: newFileProjectBase });
      handleFilePreviewClick(undefined as any, fileNode);
    } catch (error) {
      console.error("Failed to create file", error);
    }
  };

  const handleCreateFolder = async (foldername: string) => {
    if (!newFileProjectBase) return;

    let targetDir = newFileProjectBase;
    if (highlightedPath && highlightedPath.startsWith(newFileProjectBase)) {
      try {
        const metadata = await stat(highlightedPath, {
          baseDir: BaseDirectory.Home,
        });
        if (metadata.isDirectory) {
          targetDir = highlightedPath;
        } else {
          targetDir = highlightedPath.substring(
            0,
            highlightedPath.lastIndexOf("/"),
          );
        }
      } catch (e) {
        console.error("Error checking highlighted path", e);
      }
    }

    const fullPath = `${targetDir}/${foldername}`;
    try {
      await mkdir(fullPath, {
        baseDir: BaseDirectory.Home,
      });

      const invalidateTree = (nodes: TreeItemData[]): TreeItemData[] =>
        nodes.map((n) => ({
          ...n,
          loadedChildren: false,
          children: n.children ? invalidateTree(n.children) : [],
        }));

      setProjects((prev) =>
        prev.map((proj) =>
          proj.path === newFileProjectBase
            ? {
                ...proj,
                loadedChildren: false,
                children: invalidateTree(proj.children),
              }
            : proj,
        ),
      );
    } catch (error) {
      console.error("Failed to create folder", error);
    }
  };

  const handleDeleteConfirm = async () => {
    const { path, type, projectPath } = deleteModal;
    try {
      await remove(path, {
        baseDir: BaseDirectory.Home,
        recursive: type === "folder",
      });

      // Update selectedFiles in AppContext if necessary
      setSelectedFiles((prev) => prev.filter((f) => f.path !== path));
      if (setSelectedFile) {
        setSelectedFile((prev) => (prev?.path === path ? null : prev));
      }

      const invalidateTree = (nodes: TreeItemData[]): TreeItemData[] =>
        nodes.map((n) => ({
          ...n,
          loadedChildren: false,
          children: n.children ? invalidateTree(n.children) : [],
        }));

      setProjects((prev) =>
        prev.map((proj) =>
          proj.path === projectPath
            ? {
                ...proj,
                loadedChildren: false,
                children: invalidateTree(proj.children),
              }
            : proj,
        ),
      );
    } catch (error) {
      console.error(`Failed to delete ${type}`, error);
    } finally {
      setDeleteModal((prev) => ({ ...prev, open: false }));
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
      })),
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
    const invalidateTree = (nodes: TreeItemData[]): TreeItemData[] =>
      nodes.map((n) => ({
        ...n,
        loadedChildren: false,
        children: n.children ? invalidateTree(n.children) : [],
      }));

    const unlistenPromise = listen<string[]>("fs_change", () => {
      setProjects((prev) =>
        prev.map((proj) => ({
          ...proj,
          loadedChildren: false,
          children: invalidateTree(proj.children),
        })),
      );
    });
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [setProjects]);
  useEffect(() => {
    (async () => {
      const allConfigs = await Promise.all(
        projects.map((proj) => searchConfigFiles(proj.path)),
      );
      setConfigFiles(allConfigs.flat());
    })();
  }, [projects, setConfigFiles, searchConfigFiles]);

  const buttonLabel = showShortcuts ? (
    platform() === "macos" ? (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          justifyContent: "center",
        }}
      >
        Load Project
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            opacity: 0.8,
            fontSize: "0.85em",
            ml: 0.5,
          }}
        >
          (<KeyboardCommandKey sx={{ fontSize: "14px" }} /> + O)
        </Box>
      </Box>
    ) : (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          justifyContent: "center",
        }}
      >
        Load Project
        <Box
          component="span"
          sx={{ opacity: 0.8, fontSize: "0.85em", ml: 0.5 }}
        >
          (Ctrl + O)
        </Box>
      </Box>
    )
  ) : (
    "Load Project"
  );

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ p: 1 }}>
        <Box
          sx={{
            textAlign: "center",
            mt: isCollapsed ? 0 : 2,
            mb: isCollapsed ? 0 : 4,
            position: "relative",
            height: isCollapsed ? "40px" : "60px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            ...(isCollapsed && {
              marginTop: "0px",
              marginBottom: "20px",
            }),
          }}
        >
          {showLogo && (
            <>
              {/* Full Logo */}
              <Box
                sx={{
                  position: "absolute",
                  opacity: isCollapsed ? 0 : 1,
                  transform: isCollapsed
                    ? "rotate(-180deg) scale(0.5)"
                    : "rotate(0deg) scale(1)",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  pointerEvents: isCollapsed ? "none" : "auto",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <LogoSVG />
              </Box>
              {/* Small Logo */}
              <Box
                sx={{
                  position: "absolute",
                  opacity: isCollapsed ? 1 : 0,
                  transform: isCollapsed
                    ? "rotate(0deg) scale(1)"
                    : "rotate(180deg) scale(0.5)",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  pointerEvents: isCollapsed ? "auto" : "none",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <SmallLogoSVG width="32px" height="32px" />
              </Box>
            </>
          )}
        </Box>

        {!isCollapsed && (
          <>
            <RetroButton
              fullWidth
              onClick={() => setNewProjectModalOpen(true)}
              startIcon={<AddBox />}
              sx={{ height: 40, mb: 1, py: 0 }}
            >
              New Project
            </RetroButton>
            <RetroButton
              fullWidth
              onClick={openProject}
              startIcon={<FolderSpecial />}
              sx={{ height: 40, mb: 1, py: 0 }}
            >
              {buttonLabel}
            </RetroButton>
            <RetroButton
              fullWidth
              onClick={newFile}
              startIcon={<InsertDriveFile />}
              sx={{ height: 40, mt: 1, py: 0 }}
              variant="outlined"
            >
              Load File
            </RetroButton>
            <SearchFiles
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </>
        )}
      </Box>
      {/* Project list */}
      {!isCollapsed && (
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            overflowX: "hidden",
            px: 1,
            pb: 2,
          }}
        >
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
                {/* Header ... */}
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Tooltip
                      arrow
                      disableInteractive
                      enterDelay={500}
                      title="New folder"
                    >
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNewItemOpen(project.path, "folder");
                        }}
                        size="small"
                      >
                        <CreateNewFolder fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      arrow
                      disableInteractive
                      enterDelay={500}
                      title="New file"
                    >
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNewItemOpen(project.path, "file");
                        }}
                        size="small"
                      >
                        <NoteAdd fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
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
                      maxHeight: "calc(100vh - 450px)",
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
                          prev + 1 < projects.length ? prev + 1 : 0,
                        )
                      }
                      onMovePrev={() =>
                        setActiveSearchProjectIndex(
                          (prev) =>
                            (prev - 1 + projects.length) % projects.length,
                        )
                      }
                      onDelete={(_e, type, path, name) =>
                        setDeleteModal({
                          open: true,
                          type,
                          path,
                          name,
                          projectPath: project.path,
                        })
                      }
                    />
                  </Box>
                </AccordionItem>
              </Box>
            ))
          )}
        </Box>
      )}
      <Box
        sx={{
          flexShrink: 0,
          mt: "auto",
          p: 1,
          borderTop: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: isCollapsed ? "center" : "flex-start",
        }}
      >
        <SettingsMenu />
      </Box>
      <CreateItemModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={modalType === "file" ? handleCreateFile : handleCreateFolder}
        type={modalType}
        initialDirectory={
          highlightedPath &&
          newFileProjectBase &&
          highlightedPath.startsWith(newFileProjectBase)
            ? highlightedPath
            : newFileProjectBase || ""
        }
      />
      <DeleteConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal((prev) => ({ ...prev, open: false }))}
        onConfirm={handleDeleteConfirm}
        itemName={deleteModal.name}
        itemType={deleteModal.type}
      />
      <NewProjectModal
        open={newProjectModalOpen}
        onClose={() => setNewProjectModalOpen(false)}
        onProjectCreated={handleNewProjectCreated}
      />
    </Box>
  );
}
