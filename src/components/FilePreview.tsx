import { useEffect, useState, useRef, useCallback } from "react";
import useShortcut from "../utils/useShortcut";
import { Box, Card, CardContent, CardHeader, Modal, Grid } from "@mui/material";
import * as monaco from "monaco-editor";
import "./FilePreview.css";
import {
  BaseDirectory,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { useAppContext } from "../context/AppContext";
import { getImageMime, isImage, loadImageDataUrl } from "../utils/image";
import RetroButton from "./RetroButton";
import { useUserContext } from "../context/UserContext";

interface FilePreviewProps {
  file: {
    id: string;
    name: string;
    path: string;
  };
}
const getLanguage = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "tsx":
    case "ts":
      return "typescript";
    case "js":
      return "javascript";
    case "json":
      return "json";
    case "html":
      return "xml";
    case "xml":
      return "xml";
    default:
      return "plaintext";
  }
};

function FilePreview({ file }: FilePreviewProps) {
  const [isDirty, setIsDirty] = useState(false);
  const { themeMode } = useUserContext();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const saveToFile = useCallback(async () => {
    if (editorRef.current) {
      try {
        const content = editorRef.current.getValue();
        await writeTextFile(file.path, content, {
          baseDir: BaseDirectory.Home,
        });
        setIsDirty(false);
      } catch (err) {
        console.error("Save failed:", err);
      }
    }
  }, [file.path]);

  const { handleFileSelect, setSelectedFile, selectedFiles } = useAppContext();
  const isSelected = selectedFiles.some(
    (selected) => selected.path === file.path
  );
  const monacoEl = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let isMounted = true;

    if (isImage(file.name)) {
      loadImageDataUrl(file.path, getImageMime(file.name))
        .then((dataUrl) => {
          if (isMounted) {
            if (monacoEl.current) {
              monacoEl.current.innerHTML = "";
              monacoEl.current.style.display = "flex";
              monacoEl.current.style.justifyContent = "center";
              monacoEl.current.style.alignItems = "center";
              const img = document.createElement("img");
              img.src = dataUrl as string;
              img.style.objectFit = "scale-down";
              img.style.objectPosition = "center";
              monacoEl.current.appendChild(img);
            }
          }
        })
        .catch((error) => {
          console.error("Error loading image", error);
        });
    } else {
      readTextFile(file.path)
        .then((text) => {
          if (isMounted && monacoEl.current) {
            const editor = monaco.editor.create(monacoEl.current, {
              value: text,
              language: getLanguage(file.name),
              readOnly: false,
              automaticLayout: true,
              defaultColorDecorators: true,
              minimap: { enabled: false },
              quickSuggestions: false,
              theme: themeMode === "dark" ? "vs-dark" : "vs",
            });
            editorRef.current = editor;
            editor.onDidChangeModelContent(() => {
              setIsDirty(true);
            });
            setIsDirty(false);
            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(
              {
                noSyntaxValidation: true,
                noSemanticValidation: true,
              }
            );
          }
        })
        .catch((error) => {
          console.error(error);
          if (isMounted && monacoEl.current) {
            monaco.editor.create(monacoEl.current, {
              value: "Error loading file.",
              language: "plaintext",
              readOnly: true,
              automaticLayout: true,
              minimap: { enabled: false },
            });
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [file, themeMode]);
  const closePreview = () => {
    setSelectedFile(null);
  };
  useShortcut("Escape", closePreview);
  useShortcut("s", saveToFile, { ctrlKey: true, metaKey: true });
  return (
    <Card
      className="file-preview-card"
      variant="outlined"
      sx={{ maxHeight: "80vh", width: "100%", overflow: "auto" }}
    >
      <CardHeader
        title={
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Box>{file.name}</Box>
              <Box sx={{ typography: "caption", color: "text.secondary" }}>
                {file.path}
              </Box>
            </Grid>
            <Grid item>
              <RetroButton
                onClick={closePreview}
                sx={{ height: 40, minWidth: 40 }}
                variant="outlined"
              >
                Close (Esc)
              </RetroButton>
            </Grid>
            <Grid item xs={12}>
              <RetroButton
                onClick={() => {
                  handleFileSelect(file);
                }}
                sx={{ height: 30, m: 1 }}
                variant="outlined"
              >
                {isSelected ? "Remove" : "Add"}
              </RetroButton>
              <RetroButton
                onClick={saveToFile}
                disabled={!isDirty}
                sx={{ height: 30, m: 1 }}
              >
                Save (cmd + s)
              </RetroButton>
            </Grid>
          </Grid>
        }
        sx={{
          position: "sticky",
          top: 0,
          backgroundColor: "background.paper",
          zIndex: 1,
        }}
      />
      <CardContent sx={{ margin: 0, padding: 0 }}>
        <div ref={monacoEl} style={{ height: "80vh", width: "100%" }} />
      </CardContent>
    </Card>
  );
}
const FilePreviewModal = () => {
  const { selectedFile, setSelectedFile } = useAppContext();
  return (
    <Modal open={Boolean(selectedFile)} onClose={() => setSelectedFile(null)}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          minWidth: "80%",
        }}
      >
        {selectedFile && <FilePreview file={selectedFile} />}
      </Box>
    </Modal>
  );
};
export default FilePreviewModal;
