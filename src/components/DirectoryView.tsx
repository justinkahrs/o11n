import { useState } from "react";
import { BaseDirectory, stat } from "@tauri-apps/plugin-fs";
import { TreeView, TreeItem } from "@mui/lab";
import { ExpandMore, ChevronRight, Folder as FolderIcon, InsertDriveFile as FileIcon } from "@mui/icons-material";
import { Box } from "@mui/material";

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
  onFileSelect: (file: { id: string; name: string; path: string; size: number }) => void;
  showDotfiles: boolean;
  loadChildren: (node: TreeItemData) => Promise<void>;
}

export default function DirectoryView({ node, onFileSelect, showDotfiles, loadChildren }: DirectoryViewProps) {
  const [expanded, setExpanded] = useState<string[]>([]);

  const handleToggle = async (event: React.SyntheticEvent, nodeIds: string[]) => {
    const newlyExpanded = nodeIds.filter(id => !expanded.includes(id));
    for (const id of newlyExpanded) {
      const child = node.children.find(c => c.id === id && c.isDirectory && !c.loadedChildren);
      if (child) {
        await loadChildren(child);
      }
    }
    setExpanded(nodeIds);
  };

  const handleNodeSelect = async (event: React.SyntheticEvent, nodeId: string) => {
    if (nodeId === node.id) {
      return;
    }
    const child = node.children.find(c => c.id === nodeId);
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
    <TreeView
      aria-label="directory tree"
      defaultCollapseIcon={<ExpandMore />}
      defaultExpandIcon={<ChevronRight />}
      expanded={expanded}
      onNodeToggle={handleToggle}
      onNodeSelect={handleNodeSelect}
      sx={{ marginLeft: 1 }}
    >
      <TreeItem
        nodeId={node.id}
        label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FolderIcon fontSize="small" />
            <span>{node.name}/</span>
          </Box>
        }
      >
        {node.children.map(child => {
          if (child.isDirectory) {
            return (
              <DirectoryView
                key={child.id}
                node={child}
                onFileSelect={onFileSelect}
                showDotfiles={showDotfiles}
                loadChildren={loadChildren}
              />
            );
          } else {
            return (
              <TreeItem
                key={child.id}
                nodeId={child.id}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FileIcon fontSize="small" />
                    <span>{child.name}</span>
                  </Box>
                }
              />
            );
          }
        })}
      </TreeItem>
    </TreeView>
  );
}