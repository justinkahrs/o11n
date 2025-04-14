import { Button, CircularProgress, Tooltip } from "@mui/material";
import { useState, useEffect, useCallback, useRef } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { readTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { generateFileMap } from "../utils/generateFileMap";
import formattingInstructions from "../utils/mdFormattingInstructions.txt?raw";
import { getMarkdownLanguage } from "../utils/markdownLanguages";
import { ContentCopy } from "@mui/icons-material";
import { useAppContext } from "../context/AppContext";
import { useUserContext } from "../context/UserContext";
import { invoke } from "@tauri-apps/api/core";
export default function Copy() {
  const { instructions, selectedFiles, customTemplates } = useAppContext();
  const { countTokens, formatOutput, includeFileTree } = useUserContext();

  const [copying, setCopying] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [promptTokenCount, setPromptTokenCount] = useState<number | null>(null);

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
    const filePaths = selectedFiles.map((file) => file.path);
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
            getExtension(template.path)
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
          setPromptTokenCount(tokens as number);
        } catch (e) {
          console.log({ e });
        }
      })();
    }, 1000); // debounce delay of 1000ms
    return () => clearTimeout(handler);
  }, [buildPromptText, countTokens]);

  async function handleCopy() {
    setCopying(true);
    const promptText = await buildPromptText();
    await writeText(promptText);
    setCopying(false);
    setPromptCopied(true);
    setTimeout(() => {
      setPromptCopied(false);
    }, 3000);
  }
  const formattedTokenCount =
    promptTokenCount !== null
      ? promptTokenCount >= 1000
        ? `${Math.round(promptTokenCount / 1000)}k`
        : promptTokenCount.toString()
      : "";

  if (!countTokens) {
    return (
      <Button
        variant="contained"
        onClick={handleCopy}
        startIcon={
          copying ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <ContentCopy />
          )
        }
        disabled={copying || instructions.trim() === ""}
        size="large"
        sx={{ width: "350px" }}
      >
        {copying
          ? "Processing..."
          : promptCopied
          ? "Prompt Copied!"
          : formattedTokenCount
          ? `Copy Prompt (~${formattedTokenCount} tokens)`
          : "Copy Prompt"}
      </Button>
    );
  }
  return (
    <Tooltip
      enterDelay={1000}
      title={`${
        promptTokenCount !== null ? promptTokenCount : "calculating..."
      } tokens`}
      placement="right"
    >
      <Button
        variant="contained"
        onClick={handleCopy}
        startIcon={
          copying ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <ContentCopy />
          )
        }
        disabled={copying || instructions.trim() === ""}
        size="large"
        sx={{ width: "350px" }}
      >
        {copying
          ? "Processing..."
          : promptCopied
          ? "Prompt Copied!"
          : formattedTokenCount
          ? `Copy Prompt (~${formattedTokenCount} tokens)`
          : "Copy Prompt"}
      </Button>
    </Tooltip>
  );
}
