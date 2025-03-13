import { useState, useEffect } from "react";
import { BaseDirectory, readDir } from "@tauri-apps/plugin-fs";

import { Box, FormControlLabel, Checkbox } from "@mui/material";
import DirectoryView from "./DirectoryView";

interface TreeItemData {
  id: string;
  name: string;
  path: string;
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

  // The root node: "Home" at path "."
  const [root, setRoot] = useState<TreeItemData>({
    id: "Home",
    name: "Home",
    path: ".",
    isDirectory: true,
    children: [],
    loadedChildren: false,
  });

  // Load the children for a directory node if not already loaded
  async function loadChildren(node: TreeItemData) {
    if (!node.isDirectory) return;
    const contents = await readDir(node.path, {
      baseDir: BaseDirectory.Home,
    });

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

    // Force a re-render of root if we changed a node inside it
    setRoot((prev) => ({ ...prev }));
  }

  // Whenever showDotfiles changes, reset the tree
  useEffect(() => {
    setRoot({
      id: "Home",
      name: "Home",
      path: ".",
      isDirectory: true,
      children: [],
      loadedChildren: false,
    });
  }, [showDotfiles]);

  useEffect(() => {
    (async () => {
      if (!root.loadedChildren && root.isDirectory) {
        await loadChildren(root);
      }
    })();
  }, [root]);

  return (
    <Box
      sx={{
        width: 300,
        maxHeight: "100%",
        overflowY: "auto",
        overflowX: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <FormControlLabel
        control={
          <Checkbox
            checked={showDotfiles}
            onChange={(e) => setShowDotfiles(e.target.checked)}
          />
        }
        label="Dotfiles"
      />
      {/* Render the root as a directory node with its own TreeView */}
      <DirectoryView
        node={root}
        onFileSelect={onFileSelect}
        showDotfiles={showDotfiles}
        loadChildren={loadChildren}
      />
    </Box>
  );
}