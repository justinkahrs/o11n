import { useEffect, useState, useCallback } from "react";
import useShortcut from "../utils/useShortcut";
import { Box, Card, CardContent, CardHeader, Modal, Grid } from "@mui/material";
import "./FilePreview.css";
import {
  BaseDirectory,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { useAppContext } from "../context/AppContext";
import { getImageMime, isImage, loadImageDataUrl } from "../utils/image";
import RetroButton from "./RetroButton";
import { KeyboardCommandKey } from "@mui/icons-material";
import { platform } from "@tauri-apps/plugin-os";
import MonacoEditor from "./MonacoEditor";
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
    case "xml":
      return "xml";
    default:
      return "plaintext";
  }
};
function FilePreview({ file }: FilePreviewProps) {
  const [text, setText] = useState<string>("");
  const [isDirty, setIsDirty] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const language = getLanguage(file.name);
  const saveToFile = useCallback(async () => {
    try {
      await writeTextFile(file.path, text, {
        baseDir: BaseDirectory.Home,
      });
      setIsDirty(false);
    } catch (err) {
      console.error("Save failed:", err);
    }
  }, [file.path, text]);
  const { handleFileSelect, setSelectedFile, selectedFiles } = useAppContext();
  const isSelected = selectedFiles.some(
    (selected) => selected.path === file.path
  );
  useEffect(() => {
    let isMounted = true;
    if (isImage(file.name)) {
      loadImageDataUrl(file.path, getImageMime(file.name))
        .then((dataUrl) => {
          if (isMounted) setImageDataUrl(dataUrl as string);
        })
        .catch((error) => {
          console.error("Error loading image", error);
        });
    } else {
      readTextFile(file.path)
        .then((content) => {
          if (isMounted) {
            setText(content);
            setIsDirty(false);
          }
        })
        .catch((error) => {
          console.error(error);
          if (isMounted) {
            setText("Error loading file.");
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [file]);
  const closePreview = () => {
    setSelectedFile(null);
  };
  useShortcut("Escape", closePreview);
  useShortcut("s", saveToFile, { ctrlKey: true, metaKey: true });
  const cmd =
    platform() === "macos" ? (
      <Box>
        (
        <KeyboardCommandKey
          sx={{
            paddingTop: "2px",
            fontSize: "14px",
          }}
        />
        +S)
      </Box>
    ) : (
      "(Ctrl+S)"
    );
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
                onClick={() => handleFileSelect(file)}
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
                Save {cmd}
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
        {isImage(file.name) ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "80vh",
              width: "100%",
            }}
          >
            {imageDataUrl && (
              <img
                alt="preview"
                src={imageDataUrl}
                style={{
                  objectFit: "contain",
                  objectPosition: "center",
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
              />
            )}
          </Box>
        ) : (
          <Box sx={{ height: "80vh", width: "100%" }}>
            <MonacoEditor
              value={text}
              language={language}
              onChange={(value) => {
                setText(value);
                setIsDirty(true);
              }}
            />
          </Box>
        )}
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
