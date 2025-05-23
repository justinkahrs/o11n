import * as prettier from "prettier/standalone";
import * as parserBabel from "prettier/parser-babel";
import prettierPluginEstree from "prettier/plugins/estree";
import * as parserTypescript from "prettier/parser-typescript";
import * as parserHtml from "prettier/parser-html";
import { invoke } from "@tauri-apps/api/core";

export interface PrettierConfigFile {
  name: string;
  path: string;
}

export async function formatWithPrettier(
  text: string,
  fileName: string,
  configFiles: PrettierConfigFile[]
): Promise<string> {
  // Determine parser based on file extension
  const ext = fileName.split(".").pop()?.toLowerCase();
  let parserName = "babel";
  switch (ext) {
    case "ts":
    case "tsx":
      parserName = "typescript";
      break;
    case "js":
      parserName = "babel";
      break;
    case "json":
      parserName = "json";
      break;
    case "html":
    case "xml":
      parserName = "html";
      break;
  }

  // Load Prettier config if present
  const configFile = configFiles.find((c) =>
    /\.(prettierrc(\.json)?|prettier\.config\.js)$/i.test(c.name)
  );
  let config: Record<string, unknown> = {};
  if (configFile) {
    try {
      const configText = await invoke<string>("read_file", {
        path: configFile.path,
      });
      config = JSON.parse(configText);
    } catch (e) {
      console.error("Failed to parse prettier config", e);
    }
  }

  // Format and return
  return prettier.format(text, {
    ...config,
    parser: parserName,
    plugins: [parserBabel, parserTypescript, parserHtml, prettierPluginEstree],
  });
}
