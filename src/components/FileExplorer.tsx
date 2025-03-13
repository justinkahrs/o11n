import type { JSX } from "react";
import { useEffect, useState } from "react";
import { BaseDirectory, readDir, stat } from "@tauri-apps/plugin-fs";

import "./FileExplorer.css";

interface File {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
  isSymlink: false;
}

interface ItemProps {
  file: File;
  currentPath: string;
  handleClick: (fileName: string) => void;
  onFileSelect: (file: {
    id: string;
    name: string;
    path: string;
    size: number;
  }) => void;
}

const Item = ({
  file,
  currentPath,
  handleClick,
  onFileSelect,
}: ItemProps): JSX.Element => (
  <div
    key={file.name}
    className={file.isDirectory ? "dir" : "file"}
    onClick={async () => {
      if (file.isDirectory) {
        handleClick(file.name);
      } else {
        const filePath =
          currentPath === "." ? file.name : `${currentPath}/${file.name}`;
        const metadata = await stat(filePath, { baseDir: BaseDirectory.Home });
        const selectedFile = {
          id: `${file.name}-${Date.now()}`,
          name: file.name,
          path: filePath,
          size: metadata.size / (1024 * 1024),
        };
        onFileSelect(selectedFile);
      }
    }}
    onKeyDown={() => {
      if (file.isDirectory) {
        handleClick(file.name);
      }
    }}
  >
    {file.isDirectory ? "📁" : "📄"}
    {file.name}
    {file.isDirectory ? "/" : ""}
  </div>
);

interface FileExplorerProps {
  onFileSelect: (file: {
    id: string;
    name: string;
    path: string;
    size: number;
  }) => void;
}

const FileExplorer = ({ onFileSelect }: FileExplorerProps): JSX.Element => {
  // Use relative path (starting at ".") relative to BaseDirectory.Home
  const [files, setFiles] = useState<File[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(".");
  const [showDotfiles, setShowDotfiles] = useState<boolean>(false);

  useEffect(() => {
    async function getFiles() {
      const contents = await readDir(currentPath, {
        baseDir: BaseDirectory.Home,
      });

      let fileEntries = contents.map((entry) => ({
        name: entry.name || "",
        isDirectory: !!entry.isDirectory,
        isFile: entry.isFile,
        isSymlink: entry.isSymlink,
      }));

      function getCategory(file: {
        name: string;
        isDirectory: boolean;
      }): number {
        return file.isDirectory ? 0 : 1;
      }

      fileEntries.sort((a, b) => {
        const categoryA = getCategory(a);
        const categoryB = getCategory(b);
        if (categoryA !== categoryB) {
          return categoryA - categoryB;
        }
        return a.name.localeCompare(b.name);
      });

      if (!showDotfiles) {
        fileEntries = fileEntries.filter(
          (entry) => !entry.name.startsWith(".")
        );
      }

      setFiles([...fileEntries]);
    }
    getFiles();
  }, [currentPath, showDotfiles]);

  function handleClick(name: string) {
    setFiles([]);
    const newPath = currentPath === "." ? name : `${currentPath}/${name}`;
    setCurrentPath(newPath);
  }

  return (
    <div className="files">
      <div
        className="dirname"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          {(() => {
            const parts =
              currentPath === "." ? [] : currentPath.split("/").filter(Boolean);
            // Build full breadcrumbs array: always start with Home
            const breadcrumbs: { name: string; path: string }[] = [
              { name: "Home", path: "." },
            ];
            let accumulated = "";
            for (let i = 0; i < parts.length; i++) {
              accumulated = accumulated
                ? `${accumulated}/${parts[i]}`
                : parts[i];
              breadcrumbs.push({ name: parts[i], path: accumulated });
            }
            // If there are more than 4 levels deep (i.e. more than 5 items including Home), truncate with an ellipsis.

            if (breadcrumbs.length > 4) {
              const ellipsisTarget = breadcrumbs[breadcrumbs.length - 4].path;
              const displayedBreadcrumbs = [
                breadcrumbs[0],
                { name: "...", path: ellipsisTarget },
                ...breadcrumbs.slice(breadcrumbs.length - 2),
              ];
              return displayedBreadcrumbs.map((crumb, index) => (
                <span key={`${crumb.path}-${index}`}>
                  <span
                    style={{ cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => {
                      setFiles([]);
                      setCurrentPath(crumb.path);
                    }}
                    onKeyDown={() => {
                      setFiles([]);
                      setCurrentPath(crumb.path);
                    }}
                  >
                    {crumb.name}
                  </span>
                  {index < displayedBreadcrumbs.length - 1 ? " / " : ""}
                </span>
              ));
            }
            return breadcrumbs.map((crumb, index) => (
              <span key={`${crumb.path}-${index}`}>
                <span
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => {
                    setFiles([]);
                    setCurrentPath(crumb.path);
                  }}
                  onKeyDown={() => {
                    setFiles([]);
                    setCurrentPath(crumb.path);
                  }}
                >
                  {crumb.name}
                </span>
                {index < breadcrumbs.length - 1 ? " / " : ""}
              </span>
            ));
          })()}
        </div>
        <div>
          <label style={{ cursor: "pointer", fontSize: "0.9rem" }}>
            <input
              type="checkbox"
              checked={showDotfiles}
              onChange={(e) => setShowDotfiles(e.target.checked)}
              style={{ marginRight: "0.3rem" }}
            />
            Dotfiles
          </label>
        </div>
      </div>
      <div className="filelist">
        {files.map((file: File, i) => (
          <Item
            key={`${file.name}-${i}`}
            file={file}
            currentPath={currentPath}
            handleClick={handleClick}
            onFileSelect={onFileSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;
