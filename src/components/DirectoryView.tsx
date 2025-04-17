import { useEffect, useState } from "react";
import { BaseDirectory, stat } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { TreeView, TreeItem } from "@mui/lab";
import {
  ExpandMore,
  ChevronRight,
  Folder as FolderIcon,
} from "@mui/icons-material";
import { Box } from "@mui/material";
import { useUserContext } from "../context/UserContext";
import type { FileNode, TreeItemData } from "../types";

export interface DirectoryViewProps {
  node: TreeItemData;
  onPreviewFile: (event: React.SyntheticEvent, file: FileNode) => void;
  onFileSelect: (file: FileNode) => void;
  showDotfiles: boolean;
  loadChildren: (node: TreeItemData) => Promise<void>;
  searchQuery: string;
}
import FileItemWithHover from "./FileItemWithHover";
import { isImage } from "../utils/image";

export default function DirectoryView({
  node,
  onPreviewFile,
  onFileSelect,
  showDotfiles,
  loadChildren,
  searchQuery,
}: DirectoryViewProps) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const { countTokens } = useUserContext();

  // Automatically refresh node children if the node is expanded but not loaded.
  useEffect(() => {
    if (expanded.includes(node.id) && !node.loadedChildren) {
      loadChildren(node);
    }
  }, [expanded, node, loadChildren]);

  const filterChildren = (nodes: TreeItemData[]): TreeItemData[] => {
    if (!searchQuery) return nodes;
    return nodes.reduce((acc: TreeItemData[], node) => {
      if (node.isDirectory) {
        const filteredSubChildren = filterChildren(node.children);
        if (
          node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          filteredSubChildren.length > 0
        ) {
          acc.push({ ...node, children: filteredSubChildren });
        }
      } else {
        if (node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          acc.push(node);
        }
      }
      return acc;
    }, []);
  };

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

  const handleNodeSelect = async (
    _event: React.SyntheticEvent,
    nodeId: string
  ) => {
    _event.stopPropagation();
    // Ignore selection on a dummy node.
    if (nodeId === `${node.id}-dummy`) {
      return;
    }
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
      onFileSelect(file);
    }
  };

  return (
    <TreeView
      aria-label="directory tree"
      defaultCollapseIcon={<ExpandMore />}
      defaultExpandIcon={<ChevronRight />}
      expanded={expanded}
      onNodeToggle={handleToggle}
      onNodeSelect={handleNodeSelect}
      sx={{ marginLeft: 1 }}
    >
      {node.loadedChildren ? (
        filterChildren(node.children).map((child) => {
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
                  showDotfiles={showDotfiles}
                  loadChildren={loadChildren}
                  searchQuery={searchQuery}
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
                // tokenSize,
              }}
              nodeId={child.id}
              onPreviewFile={onPreviewFile}
            />
          );
        })
      ) : null
      }
    </TreeView>
  );
}
