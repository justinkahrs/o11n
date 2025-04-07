import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, CardHeader, CircularProgress } from "@mui/material";
import hljs from "highlight.js";
import { readTextFile } from "@tauri-apps/plugin-fs";
interface FilePreviewProps {
  file: {
    id: string;
    name: string;
    path: string;
  };
}
const getLanguage = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch(ext) {
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
export default function FilePreview({ file }: FilePreviewProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    readTextFile(file.path)
      .then(text => {
        if (isMounted) {
          const lang = getLanguage(file.name);
          const highlighted = hljs.highlight(text, { language: lang }).value;
          setContent(highlighted);
          setLoading(false);
        }
      })
      .catch(error => {
        console.error("Error reading file", error);
        if (isMounted) {
          setContent("Error loading file.");
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, [file]);
  return (
    <Card variant="outlined" sx={{ maxHeight: "100%", overflow: "auto" }}>
      <CardHeader title={file.name} />
      <CardContent>
        {loading ? (
          <CircularProgress />
        ) : (
          <Box
            component="pre"
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowX: "auto"
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </CardContent>
    </Card>
  );
}