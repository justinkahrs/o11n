import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  CircularProgress,
  Modal,
  Grid,
} from "@mui/material";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import "./FilePreview.css";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { useAppContext } from "../context/AppContext";
import { getImageMime, isImage } from "../utils/image";
import { loadImageDataUrl } from "../utils/image";
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
  const { handleFileSelect, setSelectedFile, selectedFiles } = useAppContext();
  const isSelected = selectedFiles.some(
    (selected) => selected.path === file.path
  );
  const [content, setContent] = useState<string>("");
  const [imgSrc, setImgSrc] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    if (isImage(file.name)) {
      // If the file is an image, load it using the loadImageDataUrl util
      loadImageDataUrl(file.path, getImageMime(file.name))
        .then((dataUrl) => {
          if (isMounted) {
            setImgSrc(dataUrl as string);
            setLoading(false);
          }
        })
        .catch((error) => {
          console.error("Error loading image", error);
          if (isMounted) {
            setLoading(false);
          }
        });
    } else {
      // For non-image files, read the text and apply syntax highlighting
      readTextFile(file.path)
        .then((text) => {
          if (isMounted) {
            const lang = getLanguage(file.name);
            const highlighted = hljs.highlight(text, { language: lang }).value;
            setContent(highlighted);
            setLoading(false);
          }
        })
        .catch((error) => {
          console.error("Error reading file", error);
          if (isMounted) {
            setContent("Error loading file.");
            setLoading(false);
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
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSelectedFile(null)}
                sx={{ mr: 2 }}
              >
                Close
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  handleFileSelect(file);
                  setSelectedFile(null);
                }}
              >
                {isSelected ? "Remove file" : "Add file"}
              </Button>
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
      <CardContent
        sx={{ display: "flex", justifyContent: "center", mt: 0, pt: 0 }}
      >
        {loading ? (
          <CircularProgress />
        ) : isImage(file.name) ? (
          <img src={imgSrc} alt={file.name} />
        ) : (
          <Box
            component="pre"
            sx={{
              mt: 0,
              pt: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowX: "auto",
            }}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: required for syntax highlighting
            dangerouslySetInnerHTML={{ __html: content }}
          />
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
