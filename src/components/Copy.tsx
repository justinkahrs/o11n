import { Button } from "@mui/material";
import { readFile } from "@tauri-apps/plugin-fs";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

import type { FileNode } from "./SelectedFiles";

interface CopyProps {
  files: FileNode[];
}

export default function Copy({ files }: CopyProps) {
  async function handleCopy() {
    const lines: string[] = [];
    lines.push("<file_map>");
    lines.push("/Home/Projects/o11n");
    lines.push("└── src");
    lines.push("    ├── components");
    lines.push("    │   └── Copy.tsx");
    lines.push("    └── App.tsx");
    lines.push("</file_map>");
    lines.push("");
    lines.push("<file_contents>");

    for (const file of files) {
      let content: Uint8Array | string;
      try {
        content = await readFile(file.path);
      } catch (err) {
        // If reading fails, store an error message
        content = `/* Error reading file: ${err} */`;
      }
      lines.push(`File: ${file.path}`);
      lines.push("```tsx");
      lines.push(content as string);
      lines.push("```");
      lines.push("");
    }

    lines.push("</file_contents>");

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
