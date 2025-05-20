import { useEffect, useState, useRef } from "react";
import { Box, Card, CardContent, CardHeader, Modal, Grid } from "@mui/material";
import * as monaco from "monaco-editor";
import "monaco-editor/min/vs/editor/editor.main.css";
import "./FilePreview.css";
import {
  BaseDirectory,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { useAppContext } from "../context/AppContext";
import { isImage } from "../utils/image";
import RetroButton from "./RetroButton";

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
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const saveToFile = async () => {
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
  };
  const { handleFileSelect, setSelectedFile, selectedFiles } = useAppContext();
  const isSelected = selectedFiles.some(
    (selected) => selected.path === file.path
  );
  const monacoEl = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let isMounted = true;

    if (isImage(file.name)) {
      // If the file is an image, load it using the loadImageDataUrl util
      if (isMounted && monacoEl.current) {
        monaco.editor.create(monacoEl.current, {
          value: `![my image](${file.path})`,
          language: getLanguage(file.name),
          readOnly: true,
          automaticLayout: true,
          minimap: { enabled: false },
        });
      }
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
  }, [file]);
  return (
    <Card
      className="file-preview-card"
      variant="outlined"
      sx={{ maxHeight: "80vh", width: "100%", overflow: "auto" }}
    >
      <CardHeader
        title={
          <Grid container justifyContent="space-between">
            <Grid item>{file.name}</Grid>
            <Grid item>
              <RetroButton
                onClick={saveToFile}
                disabled={!isDirty}
                sx={{ height: 40, mr: 2 }}
              >
                Save
              </RetroButton>
              <RetroButton
                onClick={() => setSelectedFile(null)}
                sx={{ height: 40, mr: 2 }}
                variant="outlined"
              >
                Close
              </RetroButton>
              <RetroButton
                onClick={() => {
                  handleFileSelect(file);
                  setSelectedFile(null);
                }}
                sx={{ height: 40 }}
              >
                {isSelected ? "Remove file" : "Add file"}
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
      <CardContent>
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
