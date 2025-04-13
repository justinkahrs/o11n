import { Button, CircularProgress } from "@mui/material";
import { useState } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { readTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { generateFileMap } from "../utils/generateFileMap";
import formattingInstructions from "../utils/mdFormattingInstructions.txt?raw";
import { getMarkdownLanguage } from "../utils/markdownLanguages";
import { ContentCopy } from "@mui/icons-material";
import { useAppContext } from "../context/AppContext";

export default function Copy() {
  const { instructions, mode, selectedFiles, customTemplates } =
    useAppContext();

  const [copying, setCopying] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const isTalkMode = mode === "talk";
  /* COPY PROMPT SECTION */
  async function handleCopy() {
    setCopying(true);
    // Function to get the file extension
    const getExtension = (path: string) => {
      const parts = path.split("/");
      const filename = parts.pop(); // Get the last part after the last '/'
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      return filename?.includes(".") ? filename.split(".").pop()! : "";
    };
    const lines: string[] = [];
    // Generate the file map for the prompt
    const filePaths = selectedFiles.map((file) => file.path);
    const fileMap = generateFileMap(filePaths);
    // 1. File Map (Markdown)
    lines.push("## File Map");
    lines.push("```");
    lines.push(fileMap);
    lines.push("```");
    lines.push("");
    // 2. File Contents (Markdown)
    lines.push("## File Contents");
    for (const file of selectedFiles) {
      let content: Uint8Array | string;
      try {
        content = await readTextFile(file.path, {
          baseDir: BaseDirectory.Home,
        });
      } catch (err) {
        // If reading fails, store an error message
        content = `/* Error reading file: ${err} */`;
      }
      const markdownExtension = getMarkdownLanguage(getExtension(file.path));
      lines.push(`**File:** ${file.path}`);
      lines.push(`\`\`\`${markdownExtension}`);
      lines.push(content as string);
      lines.push("```");
      lines.push("");
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
    if (!isTalkMode) {
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
    // Write the final joined text to clipboard
    await writeText(lines.join("\n"));
    setCopying(false);
    setPromptCopied(true);
    setTimeout(() => {
      setPromptCopied(false);
    }, 3000);
  }
  return (
    <Button
      fullWidth
      variant="contained"
      onClick={handleCopy}
      startIcon={
        copying ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          <ContentCopy />
        )
      }
      sx={{ width: "40%" }}
      disabled={copying}
    >
      {copying
        ? "Processing..."
        : promptCopied
        ? "Prompt Copied!"
        : "Copy Prompt"}
    </Button>
  );
}
