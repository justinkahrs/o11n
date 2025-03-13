import { Button } from "@mui/material";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { readTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import type { FileNode } from "./SelectedFiles";
import { generateFileMap } from "../utils/generateFileMap";
import xmlFormattingInstructions from "../utils/xmlFormattingInstructions.txt?raw";

interface CopyProps {
  files: FileNode[];
  userInstructions: string;
}
const markdownLanguages = {
  js: "js",
  jsx: "jsx",
  ts: "ts",
  tsx: "tsx",
  json: "json",
  html: "html",
  css: "css",
  md: "markdown",
  sh: "sh",
  py: "python",
  java: "java",
  cpp: "cpp",
  c: "c",
  cs: "csharp",
  php: "php",
  rb: "ruby",
  go: "go",
  rs: "rust",
  swift: "swift",
  kt: "kotlin",
  lua: "lua",
  sql: "sql",
  toml: "toml",
  ini: "ini",
  yml: "yaml",
  yaml: "yaml",
  dockerfile: "dockerfile",
  graphql: "graphql",
};

// Function to map extension to a markdown language identifier
const getMarkdownLanguage = (ext: string) =>
  markdownLanguages[ext] || "plaintext";

export default function Copy({ files, userInstructions }: CopyProps) {
  async function handleCopy() {
    const lines: string[] = [];
    const filePaths = files.map((file) => file.path);
    const fileMap = generateFileMap(filePaths);
    lines.push("<file_map>");
    lines.push(fileMap);
    lines.push("</file_map>");
    lines.push("");
    lines.push("<file_contents>");

    for (const file of files) {
      let content: Uint8Array | string;
      try {
        content = await readTextFile(file.path, {
          baseDir: BaseDirectory.Home,
        });
      } catch (err) {
        // If reading fails, store an error message
        content = `/* Error reading file: ${err} */`;
      }
      // Function to get the file extension
      const getExtension = (path: string) => {
        const parts = path.split("/");
        const filename = parts.pop(); // Get the last part after the last '/'
        return filename?.includes(".") ? filename.split(".").pop()! : "";
      };

      const markdownExtension = getMarkdownLanguage(getExtension(file.path));
      lines.push(`File: ${file.path}`);
      lines.push(`\`\`\`${markdownExtension}`);
      lines.push(content as string);
      lines.push("```");
      lines.push("");
    }
    lines.push("</file_contents>");

    lines.push(xmlFormattingInstructions);

    lines.push("<user_instructions>");
    lines.push(userInstructions);
    lines.push("</user_instructions>");

    await writeText(lines.join("\n"));
  }

  return (
    <Button
      fullWidth
      variant="contained"
      onClick={handleCopy}
      sx={{ width: "20%" }}
    >
      Copy
    </Button>
  );
}
