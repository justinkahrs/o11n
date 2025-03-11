import { useEffect, useState } from "react";
import {
  Box,
  Checkbox,
  CircularProgress,
  FormControl,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import * as fs from "@tauri-apps/plugin-fs";

interface FileNode {
  name: string;
  path: string;
  isFile: boolean;
  isDirectory: boolean;
  isSymlink: boolean;
  children?: FileNode[];
}

interface FileExplorerProps {
  onSelectionChange: (paths: string[]) => void;
}

export function FileExplorer({ onSelectionChange }: FileExplorerProps) {
  const [baseDir, setBaseDir] = useState<fs.BaseDirectory>(
    fs.BaseDirectory.Home
  );
  const [root, setRoot] = useState<FileNode[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingRoot, setLoadingRoot] = useState(false);

  useEffect(() => {
    async function loadRoot() {
      setLoadingRoot(true);
      try {
        const entries = await fs.readDir(".", { baseDir });
        setRoot(
          entries.map((e) => ({
            name: e.name,
            path: e.path,
            isFile: e.isFile,
            isDirectory: e.isDirectory,
            isSymlink: e.isSymlink,
          }))
        );
      } catch (error) {
        console.error(error);
      }
      setLoadingRoot(false);
    }
    loadRoot();
  }, [baseDir]);

  function handleSelectionChange(newSelected: Set<string>) {
    setSelected(newSelected);
    onSelectionChange(Array.from(newSelected));
  }

  return (
    <Box
      sx={{
        width: 250,
        bgcolor: "background.paper",
        height: "100vh",
        overflowY: "auto",
      }}
    >
      <FormControl fullWidth sx={{ m: 1 }}>
        <InputLabel>Base Directory</InputLabel>
        <Select
          value={baseDir}
          label="Base Directory"
          onChange={(e) => setBaseDir(e.target.value as fs.BaseDirectory)}
        >
          {Object.keys(fs.BaseDirectory)
            .filter((k) => isNaN(Number(k)))
            .map((k) => (
              <MenuItem key={k} value={fs.BaseDirectory[k]}>
                {k}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
      {loadingRoot ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List>
          {root.map((node) => (
            <FileNodeItem
              key={node.path}
              node={node}
              selected={selected}
              onChange={handleSelectionChange}
              baseDir={baseDir}
            />
          ))}
        </List>
      )}
    </Box>
  );
}

function FileNodeItem({
  node,
  selected,
  onChange,
  baseDir,
}: {
  node: FileNode;
  selected: Set<string>;
  onChange: (newSelected: Set<string>) => void;
  baseDir: fs.BaseDirectory;
}) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FileNode[] | undefined>(
    node.children
  );
  const [loading, setLoading] = useState(false);

  async function loadChildren() {
    if (node.isDirectory && !children) {
      setLoading(true);
      try {
        const entries = await fs.readDir(node.path, { dir: undefined });
        setChildren(
          entries.map((e) => ({
            name: e.name,
            path: e.path,
            isFile: e.isFile,
            isDirectory: e.isDirectory,
            isSymlink: e.isSymlink,
          }))
        );
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    }
  }

  function getAllFiles(n: FileNode): string[] {
    if (n.isFile) return [n.path];
    if (!n.children) return [];
    return n.children.flatMap((c) => getAllFiles(c));
  }

  function isFullySelected(n: FileNode): boolean {
    if (n.isFile) return selected.has(n.path);
    if (!children) return false;
    const files = getAllFiles({ ...n, children });
    return files.length > 0 && files.every((p) => selected.has(p));
  }

  function isPartiallySelected(n: FileNode): boolean {
    if (n.isFile) return selected.has(n.path);
    if (!children) return false;
    const files = getAllFiles({ ...n, children });
    const someSelected = files.some((p) => selected.has(p));
    return someSelected && !files.every((p) => selected.has(p));
  }

  async function handleToggle() {
    if (!node.isFile && !children) {
      await loadChildren();
    }
    const newSelected = new Set(selected);
    const fully = isFullySelected(node);
    const files = node.isFile
      ? [node.path]
      : getAllFiles({ ...node, children });
    if (fully) files.forEach((f) => newSelected.delete(f));
    else files.forEach((f) => newSelected.add(f));
    onChange(newSelected);
  }

  async function handleExpand() {
    if (!expanded) await loadChildren();
    setExpanded(!expanded);
  }

  const checked = isFullySelected(node);
  const indeterminate = isPartiallySelected(node) && !checked;

  return (
    <>
      <ListItemButton onClick={node.isDirectory ? handleExpand : undefined}>
        <ListItemIcon>
          <Checkbox
            edge="start"
            checked={checked}
            indeterminate={indeterminate}
            tabIndex={-1}
            disableRipple
            onChange={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
          />
        </ListItemIcon>
        <ListItemText primary={node.name} />
        {loading ? (
          <CircularProgress size={20} />
        ) : node.isDirectory ? (
          expanded ? (
            <ExpandLess />
          ) : (
            <ExpandMore />
          )
        ) : null}
      </ListItemButton>
      {expanded && children && (
        <Box sx={{ pl: 4 }}>
          {children.map((child) => (
            <FileNodeItem
              key={child.path}
              node={child}
              selected={selected}
              onChange={onChange}
              baseDir={baseDir}
            />
          ))}
        </Box>
      )}
    </>
  );
}
