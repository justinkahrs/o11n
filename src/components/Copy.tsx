import { useState, useEffect, useCallback, useRef } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { readTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { generateFileMap } from "../utils/generateFileMap";
import formattingInstructions from "../utils/mdFormattingInstructions.txt?raw";
import { getMarkdownLanguage } from "../utils/markdownLanguages";
import {
  Clear,
  ContentCopy,
  KeyboardCommandKey,
  PlayArrow,
} from "@mui/icons-material";
import { useAppContext } from "../context/AppContext";
import { useUserContext } from "../context/UserContext";
import { invoke } from "@tauri-apps/api/core";
import { platform } from "@tauri-apps/plugin-os";
import { Box, CircularProgress } from "@mui/material";
import useShortcut from "../utils/useShortcut";
import RetroButton from "./RetroButton";
import Toast from "./Toast";
import { callZai, callOpenAi } from "../api/llm";

const getPlatform = () => {
  try {
    return platform();
  } catch (e) {
    return "unknown";
  }
};

export default function Copy() {
  const {
    instructions,
    selectedFiles,
    customTemplates,
    projects,
    setPlan,
    setTotalTokenCount,
    setSelectedFiles,
    setInstructions,
    setMode,
    chatMessages,
    setChatMessages,
  } = useAppContext();
  const {
    countTokens,
    formatOutput,
    includeFileTree,
    showShortcuts,
    apiMode,
    activeProvider,
    zaiApiKey,
    openAiApiKey,
  } = useUserContext();

  const [copying, setCopying] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [_promptTokenCount, setPromptTokenCount] = useState<number | null>(
    null,
  );

  const lastBuildTimeRef = useRef<number>(0);
  const cachedPromptTextRef = useRef<string | null>(null);

  const getExtension = useCallback((path: string): string => {
    const parts = path.split("/");
    const filename = parts.pop() ?? "";
    if (filename.includes(".")) {
      const extension = filename.split(".").pop() ?? "";
      return extension;
    }
    return "";
  }, []);

  const buildPromptText = useCallback(async (): Promise<string> => {
    const now = Date.now();
    if (cachedPromptTextRef.current && now - lastBuildTimeRef.current < 2000) {
      return cachedPromptTextRef.current;
    }
    lastBuildTimeRef.current = now;
    const lines: string[] = [];
    // 1. File Map (Markdown)
    let filePaths = selectedFiles.map((file) => file.path);
    if (filePaths.length === 0 && projects?.length) {
      filePaths = projects.map((project) => project.path);
    }
    const fileMap = generateFileMap(filePaths);
    if (includeFileTree) {
      lines.push("## File Map");
      lines.push("```");
      lines.push(fileMap);
      lines.push("```");
      lines.push("");
    }
    // 2. File Contents (Markdown)
    if (selectedFiles.length > 0) {
      lines.push("## File Contents");
      for (const file of selectedFiles) {
        let content: string;
        try {
          content = await readTextFile(file.path, {
            baseDir: BaseDirectory.Home,
          });
        } catch (err) {
          content = `/* Error reading file: ${err} */`;
        }
        const markdownExtension = getMarkdownLanguage(getExtension(file.path));
        // Only include non-image files (as in original computePrompt)
        if (markdownExtension !== "image") {
          lines.push(`**File:** ${file.path}`);
          lines.push(`\`\`\`${markdownExtension}`);
          lines.push(content);
          lines.push("```");
          lines.push("");
        }
      }
    }
    // 3. Custom Templates (Markdown)
    if (customTemplates?.length) {
      const activeTemplates = customTemplates.filter((t) => t.active);
      if (activeTemplates.length) {
        lines.push("## Custom Templates");
        for (const template of activeTemplates) {
          let content: string;
          try {
            content = await readTextFile(template.path, {
              baseDir: BaseDirectory.Home,
            });
          } catch (err) {
            content = `/* Error reading template file: ${err} */`;
          }
          const markdownExtension = getMarkdownLanguage(
            getExtension(template.path),
          );
          lines.push(`**File:** ${template.path}`);
          lines.push(`\`\`\`${markdownExtension}`);
          lines.push(content);
          lines.push("```");
          lines.push("");
        }
      }
    }
    // 4. Formatting instructions (only if not Talk Mode)
    if (formatOutput) {
      lines.push("## Additional Formatting Instructions");
      lines.push("```");
      lines.push(formattingInstructions);
      lines.push("```");
    }
    // 5. User Instructions
    lines.push("## User Instructions");
    lines.push("```");
    lines.push(instructions);
    lines.push("```");
    const promptText = lines.join("\n");
    cachedPromptTextRef.current = promptText;
    return promptText;
  }, [
    projects,
    selectedFiles,
    customTemplates,
    includeFileTree,
    instructions,
    formatOutput,
    getExtension,
  ]);

  useEffect(() => {
    if (!countTokens) {
      setPromptTokenCount(null);
      return;
    }
    const handler = setTimeout(() => {
      (async () => {
        const promptText = await buildPromptText();
        try {
          const tokens = await invoke("count_tokens", { content: promptText });
          const count = tokens as number;
          setPromptTokenCount(count);
          setTotalTokenCount(count);
        } catch (e) {
          console.log({ e });
        }
      })();
    }, 1000); // debounce delay of 1000ms
    return () => clearTimeout(handler);
  }, [buildPromptText, countTokens, setTotalTokenCount]);

  async function handleCopy() {
    setCopying(true);
    const promptText = await buildPromptText();

    if (apiMode) {
      if (activeProvider === "zai" && !zaiApiKey) {
        alert("Please set a Z.AI API Key in Settings first.");
        setCopying(false);
        return;
      }
      if (activeProvider === "openai" && !openAiApiKey) {
        alert("Please set an OpenAI API Key in Settings first.");
        setCopying(false);
        return;
      }

      try {
        let content = "";

        if (!formatOutput) {
          // Chat Mode
          const newUserMessage = {
            role: "user" as const,
            content: promptText,
            displayContent: instructions || "context evaluation",
            selectedFiles: selectedFiles,
          };

          setChatMessages((prev) => [...prev, newUserMessage]);
          setInstructions(""); // Clear input after sending

          const messagesToSend = [...chatMessages, newUserMessage].map((m) => ({
            role: m.role,
            content: m.content,
          }));

          if (activeProvider === "zai") {
            content = await callZai(messagesToSend, zaiApiKey);
          } else if (activeProvider === "openai") {
            content = await callOpenAi(messagesToSend, openAiApiKey);
          }

          setChatMessages((prev) => [...prev, { role: "assistant", content }]);
        } else {
          // Plan Mode (One-off)
          const messagesToSend = [
            { role: "user" as const, content: promptText },
          ];
          if (activeProvider === "zai") {
            content = await callZai(messagesToSend, zaiApiKey);
          } else if (activeProvider === "openai") {
            content = await callOpenAi(messagesToSend, openAiApiKey);
          }
          setMode("plan");
          setPlan(content);
        }
      } catch (error: any) {
        console.error("API Error:", error);
        alert(`Error: ${error.message}`);
      }
    } else {
      await writeText(promptText);
      setPromptCopied(true);
      setTimeout(() => {
        setPromptCopied(false);
      }, 3000);
    }

    setCopying(false);
    if (!apiMode) {
      setPlan("");
    }
  }
  function handleRefresh() {
    setInstructions("");
    setSelectedFiles([]);
  }
  useShortcut("c", handleCopy, {
    metaKey: true,
    ctrlKey: true,
    shiftKey: true,
  });
  useShortcut("Enter", handleCopy, {
    ctrlKey: true,
    metaKey: true,
  });
  useShortcut("N", handleRefresh, {
    ctrlKey: true,
    metaKey: true,
    shiftKey: true,
  });
  const currentPlatform = getPlatform();

  const cmd =
    currentPlatform === "macos" ? (
      <Box component="span">
        (
        <KeyboardCommandKey
          sx={{
            paddingTop: "2px",
            fontSize: "14px",
          }}
        />
        +↑+C)
      </Box>
    ) : (
      "(Ctrl+Shift+C)"
    );

  const enterCmd =
    currentPlatform === "macos" ? (
      <Box component="span">
        (
        <KeyboardCommandKey
          sx={{
            paddingTop: "2px",
            fontSize: "14px",
          }}
        />
        +↵)
      </Box>
    ) : (
      "(Ctrl+Enter)"
    );
  const refreshCmd =
    currentPlatform !== "macos" ? (
      <Box component="span">
        (
        <KeyboardCommandKey
          sx={{
            paddingTop: "2px",
            fontSize: "14px",
          }}
        />
        +↑+N)
      </Box>
    ) : (
      "(Ctrl+Shift+N)"
    );
  return (
    <span>
      <RetroButton
        onClick={handleCopy}
        startIcon={
          copying ? (
            <CircularProgress size={20} color="inherit" />
          ) : apiMode ? (
            <PlayArrow />
          ) : (
            <ContentCopy />
          )
        }
        disabled={copying || instructions.trim() === ""}
        sx={{ m: 2 }}
      >
        {copying
          ? "Processing..."
          : apiMode
            ? formatOutput
              ? "Run Prompt"
              : "Chat"
            : "Copy Prompt"}{" "}
        {showShortcuts && (apiMode && !formatOutput ? enterCmd : cmd)}
      </RetroButton>
      <RetroButton
        disabled={
          copying || (instructions.trim() === "" && selectedFiles.length === 0)
        }
        startIcon={<Clear />}
        variant="outlined"
        onClick={handleRefresh}
        sx={{ mx: 2 }}
      >
        Clear Prompt {showShortcuts && refreshCmd}
      </RetroButton>
      <Toast
        open={promptCopied}
        message="Prompt Copied"
        onClose={() => setPromptCopied(false)}
      />
    </span>
  );
}
