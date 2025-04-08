import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
} from "@mui/material";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import "./FilePreview.css";
import { readTextFile, readFile } from "@tauri-apps/plugin-fs";

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
const getMimeType = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    default:
      return "";
  }
};
export default function FilePreview({ file }: FilePreviewProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const mimeType = getMimeType(file.name);
    if (mimeType) {
      readFile(file.path, { encoding: "base64" })
        .then((data) => {
          if (isMounted) {
            const dataUrl = `data:${mimeType};base64,${data}`;
            setContent(dataUrl);
            setLoading(false);
          }
        })
        .catch((error) => {
          console.error("Error reading image file", error);
          if (isMounted) {
            setContent("Error loading file.");
            setLoading(false);
          }
        });
    } else {
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
      variant="outlined"
      sx={{ maxHeight: "80vh", width: "100%", overflow: "auto" }}
    >
      <CardHeader
        title={file.name}
        sx={{
          position: "sticky",
          top: 0,
          backgroundColor: "background.paper",
          zIndex: 1,
        }}
      />
      <CardContent sx={{ display: "flex", justifyContent: "center" }}>
        {loading ? (
          <CircularProgress />
        ) : getMimeType(file.name) ? (
          <img
            src={content}
            style={{ maxWidth: "100%", maxHeight: "70vh" }}
            alt={file.name}
          />
        ) : (
          <Box
            component="pre"
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowX: "auto",
            }}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: needed for syntax highlighting
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </CardContent>
    </Card>
  );
}
