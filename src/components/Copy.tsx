import { Button } from "@mui/material";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { readTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import type { FileNode } from "./SelectedFiles";
import { generateFileMap } from "../utils/generateFileMap";
import xmlFormattingInstructions from "../utils/xmlFormattingInstructions.txt?raw";
import markdownLanguages from "../utils/markdownLanguages";
import { ContentCopy } from "@mui/icons-material";
interface CustomTemplate {
  id: string;
  name: string;
  path: string;
  active: boolean;
}

interface CopyProps {
  files: FileNode[];
  userInstructions: string;
  customTemplates?: CustomTemplate[];
  variant?: string;
}

// Function to map extension to a markdown language identifier
const getMarkdownLanguage = (ext: string) => {
  console.log({ ext });
  return markdownLanguages[ext.toLowerCase()] || "plaintext";
};

export default function Copy({
  customTemplates,
  files,
  userInstructions,
}: CopyProps) {
  /* COPY PROMPT SECTION */
  async function handleCopy() {
    // Function to get the file extension
    const getExtension = (path: string) => {
      const parts = path.split("/");
      const filename = parts.pop(); // Get the last part after the last '/'
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      return filename?.includes(".") ? filename.split(".").pop()! : "";
    };
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

      const markdownExtension = getMarkdownLanguage(getExtension(file.path));
      lines.push(`File: ${file.path}`);
      lines.push(`\`\`\`${markdownExtension}`);
      lines.push(content as string);
      lines.push("```");
      lines.push("");
    }
    lines.push("</file_contents>");
    lines.push("<custom_instructions>");
    if (customTemplates?.length) {
      for (const template of customTemplates.filter((t) => t.active)) {
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

        lines.push(`File: ${template.path}`);
        lines.push(`\`\`\`${markdownExtension}`);
        lines.push(content);
        lines.push("```");
        lines.push("");
      }
    }
    lines.push("</custom_instructions>");

    lines.push(xmlFormattingInstructions);

    lines.push("<user_instructions>");
    lines.push(userInstructions);
    lines.push("</user_instructions>");

    await writeText(lines.join("\n"));
  }

  return (
    <Button
      fullWidth
      variant="outlined"
      onClick={handleCopy}
      startIcon={<ContentCopy />}
      sx={{ width: "40%" }}
    >
      Copy Prompt
    </Button>
  );
}
