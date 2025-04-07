import { useState } from "react";
import { BaseDirectory, stat } from "@tauri-apps/plugin-fs";
import { TreeView, TreeItem } from "@mui/lab";
import {
  ExpandMore,
  ChevronRight,
  Folder as FolderIcon,
} from "@mui/icons-material";
import { Box } from "@mui/material";
import FileItemWithHover from "./FileItemWithHover";

export interface TreeItemData {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeItemData[];
  loadedChildren: boolean;
}

export interface DirectoryViewProps {
  node: TreeItemData;
  onFileHover: (
    file: { id: string; name: string; path: string } | null,
    event?: React.MouseEvent<HTMLElement>
  ) => void;
  onFileSelect: (file: {
    id: string;
    name: string;
    path: string;
    size: number;
  }) => void;
  showDotfiles: boolean;
  loadChildren: (node: TreeItemData) => Promise<void>;
  searchQuery: string;
}

export default function DirectoryView({
  node,
  onFileHover,
  onFileSelect,
  showDotfiles,
  loadChildren,
  searchQuery,
}: DirectoryViewProps) {
  const [expanded, setExpanded] = useState<string[]>([]);
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
    // If the current node is expanded and its children haven't been loaded yet, load them.
    if (newlyExpanded.includes(node.id) && !node.loadedChildren) {
      await loadChildren(node);
    }
    // For each expanded child directory that hasn't been loaded, load its children.
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
      const selectedFile = {
        id: child.id,
        name: child.name,
        path: child.path,
        size: metadata.size / (1024 * 1024),
      };
      onFileSelect(selectedFile);
    }
  };

  return (
    <>
      <TreeView
        aria-label="directory tree"
        defaultCollapseIcon={<ExpandMore />}
        defaultExpandIcon={<ChevronRight />}
        expanded={expanded}
        onNodeToggle={handleToggle}
        onNodeSelect={handleNodeSelect}
        // onNodeFocus={onFileHover}
        sx={{ marginLeft: 1 }}
      >
        {node.loadedChildren ? (
          filterChildren(node.children).map((child) =>
            child.isDirectory ? (
              <TreeItem
                key={child.id}
                nodeId={child.id}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FolderIcon fontSize="small" />
                    <span>{child.name}/</span>
                  </Box>
                }
              >
                <DirectoryView
                  onFileHover={onFileHover}
                  node={child}
                  onFileSelect={onFileSelect}
                  showDotfiles={showDotfiles}
                  loadChildren={loadChildren}
                  searchQuery={searchQuery}
                />
              </TreeItem>
            ) : (
              <FileItemWithHover
                key={child.id}
                file={{ id: child.id, name: child.name, path: child.path }}
                nodeId={child.id}
                onFileHover={onFileHover}
              />
            )
          )
        ) : (
          // Render a hidden dummy child to force the expand icon to show if necessary
          <TreeItem
            nodeId={`${node.id}-dummy`}
            label=" "
            sx={{ display: "none" }}
          />
        )}
      </TreeView>
    </>
  );
}
