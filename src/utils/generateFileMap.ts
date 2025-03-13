export interface FileTree {
  [key: string]: FileTree | null;
}

function buildFileTree(paths: string[], basePath: string): FileTree {
  const tree: FileTree = {};
  paths.forEach(path => {
    // Remove basePath prefix if it exists
    const relativePath = path.startsWith(basePath) ? path.slice(basePath.length) : path;
    const parts = relativePath.split('/').filter(Boolean);
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        // It's a file
        current[part] = null;
      } else {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part] as FileTree;
      }
    }
  });
  return tree;
}

function renderTree(tree: FileTree, prefix = ''): string[] {
  const lines: string[] = [];
  const keys = Object.keys(tree).sort((a, b) => {
    // Sort directories before files; if both are same type, sort alphabetically
    const aIsDir = tree[a] !== null;
    const bIsDir = tree[b] !== null;
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });
  keys.forEach((key, index) => {
    const isLast = index === keys.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    lines.push(prefix + connector + key);
    if (tree[key] !== null) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      lines.push(...renderTree(tree[key] as FileTree, newPrefix));
    }
  });
  return lines;
}

export function generateFileMap(paths: string[]): string {
  if (paths.length === 0) return '';
  
  // Compute common base path
  const splitPaths = paths.map(p => p.split('/'));
  let commonParts = splitPaths[0];
  for (let i = 1; i < splitPaths.length; i++) {
    let j = 0;
    while (j < commonParts.length && j < splitPaths[i].length && commonParts[j] === splitPaths[i][j]) {
      j++;
    }
    commonParts = commonParts.slice(0, j);
  }
  const basePath = commonParts.join('/') || '/';
  
  const tree = buildFileTree(paths, basePath);
  const treeLines = renderTree(tree);
  return basePath + '\n' + treeLines.join('\n');
}