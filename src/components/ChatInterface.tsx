import { useEffect, useRef, useState } from "react";
import { highlightElement } from "prismjs";
import { Box, Paper, Typography, IconButton, Tooltip } from "@mui/material";
import ReactMarkdown from "react-markdown";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/themes/prism-tomorrow.css"; // Ensure a theme is available

import { useAppContext } from "../context/AppContext";

const ChatInterface = () => {
  const { chatMessages, handleFilePreviewClick } = useAppContext();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    // Highlight code blocks after rendering
    highlightAll();
  }, [chatMessages]);

  const highlightAll = () => {
    // Select all code blocks and apply highlighting
    document.querySelectorAll("pre code").forEach((block) => {
      highlightElement(block as HTMLElement);
      // Note: react-markdown handles class names for languages, prism auto-highlights if configured correctly
    });
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflow: "auto",
        p: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        gap: 2,
      }}
    >
      {chatMessages.map((msg, index) => (
        <MessageBubble
          key={index}
          msg={msg}
          handleFilePreviewClick={handleFilePreviewClick}
        />
      ))}
      <div ref={bottomRef} />
    </Box>
  );
};

const MessageBubble = ({ msg, handleFilePreviewClick }: any) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
      }}
    >
      <Paper
        elevation={1}
        sx={{
          p: 2,
          maxWidth: "80%",
          backgroundColor:
            msg.role === "user" ? "primary.dark" : "background.paper",
          color: msg.role === "user" ? "primary.contrastText" : "text.primary",
          borderRadius: 2,
          position: "relative",
          "&:hover .copy-button": {
            opacity: 1,
          },
        }}
      >
        {msg.role === "assistant" && (
          <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
            <IconButton
              className="copy-button"
              size="small"
              onClick={handleCopy}
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                opacity: 0,
                transition: "opacity 0.2s",
                backgroundColor: "background.paper",
                boxShadow: 1,
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              {copied ? (
                <CheckIcon fontSize="inherit" color="success" />
              ) : (
                <ContentCopyIcon fontSize="inherit" />
              )}
            </IconButton>
          </Tooltip>
        )}
        {msg.role === "assistant" ? (
          <div className="markdown-body">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        ) : (
          <Box>
            {msg.selectedFiles && msg.selectedFiles.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "primary.contrastText",
                    opacity: 0.8,
                    mb: 0.5,
                  }}
                >
                  Selected files:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {msg.selectedFiles.map((file: any, i: number) => (
                    <Typography
                      key={file.path}
                      variant="caption"
                      component="span"
                      onClick={(e) => handleFilePreviewClick(e, file)}
                      sx={{
                        cursor: "pointer",
                        textDecoration: "underline",
                        "&:hover": { opacity: 0.8 },
                      }}
                    >
                      {file.path.split("/").pop()}
                      {i < (msg.selectedFiles?.length || 0) - 1 ? ", " : ""}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
              {msg.displayContent || msg.content}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ChatInterface;
