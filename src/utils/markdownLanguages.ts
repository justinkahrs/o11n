const markdownLanguages: Record<string, string> = {
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
  xml: "xml",
  png: "image",
  jpg: "image",
  jpeg: "image",
  svg: "image",
};
// Function to map extension to a markdown language identifier
export const getMarkdownLanguage = (ext: string) =>
  markdownLanguages[ext.toLowerCase()] || "plaintext";
export default markdownLanguages;
