import { useEffect, useState } from "react";
import useShortcut from "../utils/useShortcut";
import { BaseDirectory, stat } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { TreeView, TreeItem } from "@mui/lab";
import {
  ExpandMore,
  ChevronRight,
  Folder as FolderIcon,
} from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useUserContext } from "../context/UserContext";
import { useAppContext } from "../context/AppContext";
import type { FileNode, TreeItemData } from "../types";

export interface DirectoryViewProps {
  node: TreeItemData;
  onPreviewFile: (event: React.SyntheticEvent, file: FileNode) => void;
  onFileSelect: (file: FileNode) => void;
  loadChildren: (node: TreeItemData) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}
import FileItemWithHover from "./FileItemWithHover";
import { isImage } from "../utils/image";
import { useFS } from "../api/fs";

export default function DirectoryView({
  node,
  onPreviewFile,
  onFileSelect,
  loadChildren,
  searchQuery,
  setSearchQuery,
}: DirectoryViewProps) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [hits, setHits] = useState<TreeItemData[]>([]);
  const [selectedHitIndex, setSelectedHitIndex] = useState(-1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { countTokens } = useUserContext();
  const { search } = useFS();
  const { mode, setMode } = useAppContext();

  const handleToggle = async (
    _event: React.SyntheticEvent,
    nodeIds: string[]
  ) => {
    const newlyExpanded = nodeIds.filter((id) => !expanded.includes(id));
    // Load children for the root node if it is newly expanded.
    if (newlyExpanded.includes(node.id) && !node.loadedChildren) {
      await loadChildren(node);
    }
    // For each newly expanded child directory without loaded children, load its children.
    for (const id of newlyExpanded) {
      if (id !== node.id) {
        const child = node.children.find(
          (c) => c.id === id && c.isDirectory && !c.loadedChildren
        );
        if (child) {
          await loadChildren(child);
        }
      }
    }
    setExpanded(nodeIds);
  };

  const handleSearchNodeSelect = async (
    _event: React.SyntheticEvent,
    nodeId: string
  ) => {
    const hit = hits.find((h) => h.id === nodeId);
    if (!hit) return;
    const metadata = await stat(hit.path, { baseDir: BaseDirectory.Home });
    const file: FileNode = {
      id: hit.id,
      name: hit.name,
      path: hit.path,
      size: metadata.size / (1024 * 1024),
    };
    if (countTokens && !isImage(hit.name)) {
      const tokenCount = await invoke("count_tokens_path", { path: hit.path });
      file.tokenSize = Number(tokenCount);
    }
    if (mode === "do") {
      setMode("plan");
    }
    setSelectedIds([hit.id]);
    onFileSelect(file);
  };
  const handleNodeSelect = async (
    _event: React.SyntheticEvent,
    nodeIds: string | string[]
  ) => {
    _event.stopPropagation();
    const nodeId = Array.isArray(nodeIds) ? nodeIds[0] : nodeIds;
    setSelectedIds([nodeId]);
    const child = node.children.find((c) => c.id === nodeId);
    if (!child) return;
    if (child.isDirectory && !child.loadedChildren) {
      await loadChildren(child);
    } else if (!child.isDirectory) {
      const metadata = await stat(child.path, { baseDir: BaseDirectory.Home });
      const file: FileNode = {
        id: child.id,
        name: child.name,
        path: child.path,
        size: metadata.size / (1024 * 1024),
      };
      if (countTokens && !isImage(child.name)) {
        const tokenCount = await invoke("count_tokens_path", {
          path: child.path,
        });
        file.tokenSize = Number(tokenCount);
      }
      if (mode === "do") {
        setMode("plan");
      }
      onFileSelect(file);
    }
  };
  // Automatically refresh node children if the node is expanded but not loaded.
  useEffect(() => {
    if (expanded.includes(node.id) && !node.loadedChildren) {
      loadChildren(node);
    }
  }, [expanded, node, loadChildren]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (searchQuery) {
        const res = await search(node.path, searchQuery);
        if (!ignore) setHits(res as TreeItemData[]);
      } else {
        setHits([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [search, searchQuery, node.path]);

  // Reset expansion when children are unloaded, to collapse the arrow indicator.
  useEffect(() => {
    if (!node.loadedChildren) {
      setExpanded([]);
    }
  }, [node.loadedChildren]);
  useEffect(() => {
    if (searchQuery) {
      setSelectedHitIndex(-1);
    }
  }, [searchQuery]);
  useShortcut(
    "ArrowDown",
    (_e) => {
      if (searchQuery && hits.length > 0) {
        setSelectedHitIndex((idx) => (idx + 1) % hits.length);
      }
    },
    { targetSelector: ".search-files" }
  );
  useShortcut(
    "ArrowUp",
    (_e) => {
      if (searchQuery && hits.length > 0) {
        setSelectedHitIndex((idx) =>
          idx === -1 ? hits.length - 1 : (idx - 1 + hits.length) % hits.length
        );
      }
    },
    { targetSelector: ".search-files" }
  );
  useShortcut(
    "Enter",
    (_e) => {
      if (searchQuery && hits.length > 0 && selectedHitIndex !== -1) {
        handleSearchNodeSelect(
          {} as React.SyntheticEvent,
          hits[selectedHitIndex].id
        );
      }
    },
    { targetSelector: ".search-files" }
  );

  return searchQuery ? (
    hits.length === 0 ? (
      <Typography sx={{ ml: 2, mt: 1 }} color="text.secondary">
        No files found
      </Typography>
    ) : (
      <TreeView
        className="directory-view"
        aria-label="search results"
        defaultCollapseIcon={<ExpandMore />}
        defaultExpandIcon={<ChevronRight />}
        selected={
          selectedHitIndex !== -1 && hits.length > 0
            ? [hits[selectedHitIndex].id]
            : []
        }
        onNodeSelect={(event: React.SyntheticEvent, nodeIds: string[]) => {
          const nodeId = Array.isArray(nodeIds) ? nodeIds[0] : nodeIds;
          handleSearchNodeSelect(event, nodeId);
        }}
        sx={{ marginLeft: 1, wordBreak: "keep-all" }}
      >
        {hits.map((hit) => (
          <FileItemWithHover
            key={hit.id}
            file={{
              id: hit.id,
              name: hit.name,
              path: hit.path,
              size: 0,
            }}
            nodeId={hit.id}
            onPreviewFile={onPreviewFile}
          />
        ))}
      </TreeView>
    )
  ) : (
    <TreeView
      className="directory-view"
      aria-label="directory tree"
      defaultCollapseIcon={<ExpandMore />}
      defaultExpandIcon={<ChevronRight />}
      expanded={expanded}
      selected={selectedIds}
      onNodeToggle={handleToggle}
      onNodeSelect={handleNodeSelect}
      sx={{ marginLeft: 1, wordBreak: "keep-all" }}
    >
      {node.loadedChildren
        ? node.children.map((child) => {
            if (child.isDirectory) {
              return (
                <TreeItem
                  key={child.id}
                  nodeId={child.id}
                  label={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        "&:hover .file-icon": { color: "primary.main" },
                      }}
                    >
                      <FolderIcon className="file-icon" fontSize="small" />
                      <span>{child.name}/</span>
                    </Box>
                  }
                >
                  <DirectoryView
                    onPreviewFile={onPreviewFile}
                    node={child}
                    onFileSelect={onFileSelect}
                    loadChildren={loadChildren}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                  />
                </TreeItem>
              );
            }
            return (
              <FileItemWithHover
                key={child.id}
                file={{
                  id: child.id,
                  name: child.name,
                  path: child.path,
                  size: 0,
                }}
                nodeId={child.id}
                onPreviewFile={onPreviewFile}
              />
            );
          })
        : null}
    </TreeView>
  );
}
