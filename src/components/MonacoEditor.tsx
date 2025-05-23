import type React from "react";
import { useRef, useEffect } from "react";
import * as monaco from "monaco-editor";
import { useAppContext } from "../context/AppContext";
import { readTextFile } from "@tauri-apps/plugin-fs";
import "monaco-editor/min/vs/editor/editor.main.css";
import JSON5 from "json5";

interface MonacoEditorProps {
  value?: string;
  language?: string;
  onChange?: (value: string) => void;
  isDiff?: boolean;
  originalValue?: string;
}
const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value = "",
  language = "javascript",
  onChange,
  isDiff = false,
  originalValue = "",
}) => {
  const { configFiles } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<
    monaco.editor.IStandaloneCodeEditor | monaco.editor.IDiffEditor
  >();
  const originalModelRef = useRef<monaco.editor.ITextModel | null>(null);
  const modifiedModelRef = useRef<monaco.editor.ITextModel | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: editor flickers if we give it more deps
  useEffect(() => {
    if (!containerRef.current) return;

    if (isDiff) {
      const diffEditor = monaco.editor.createDiffEditor(containerRef.current, {
        automaticLayout: true,
        minimap: { enabled: false },
      });
      const originalModel = monaco.editor.createModel(originalValue, language);
      const modifiedModel = monaco.editor.createModel(value, language);
      diffEditor.setModel({ original: originalModel, modified: modifiedModel });
      editorRef.current = diffEditor;
      originalModelRef.current = originalModel;
      modifiedModelRef.current = modifiedModel;
      const disposable = modifiedModel.onDidChangeContent(() => {
        onChange?.(modifiedModel.getValue());
      });
      return () => {
        disposable.dispose();
        diffEditor.dispose();
        originalModel.dispose();
        modifiedModel.dispose();
      };
    }
    const editor = monaco.editor.create(containerRef.current, {
      value,
      language,
      automaticLayout: true,
      minimap: { enabled: false },
    });
    editorRef.current = editor;
    const disposable = editor.onDidChangeModelContent(() => {
      onChange?.(editor.getValue());
    });
    return () => {
      disposable.dispose();
      editor.dispose();
    };
  }, [language, isDiff]);
  // Sync model content when `value` changes without recreating the editor
  useEffect(() => {
    if (isDiff) {
      modifiedModelRef.current?.setValue(value);
    } else {
      const editor = editorRef.current as monaco.editor.IStandaloneCodeEditor;
      const model = editor.getModel();
      if (model && model.getValue() !== value) {
        model.setValue(value);
      }
    }
  }, [value, isDiff]);
  // Load tsconfig compilerOptions from context into Monaco
  useEffect(() => {
    const tsConfigFile = configFiles?.find((c) => c.name === "tsconfig.json");
    console.log({ configFiles });
    console.log({ tsConfigFile });
    if (!tsConfigFile) return;
    readTextFile(tsConfigFile.path)
      .then((file) => {
        // Handle response which might be a string or an object with a 'text' property
        const text = typeof file === "string" ? file : (file as any).text;
        try {
          const parsed = JSON5.parse(text);
          if (parsed.compilerOptions) {
            monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
              parsed.compilerOptions
            );
          }
        } catch (e) {
          console.error("Failed to parse tsconfig.json", e);
        }
      })
      .catch((err) => console.error("Error reading tsconfig.json", err));
  }, [configFiles]);
  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", border: "1px solid #ddd" }}
    />
  );
};
export default MonacoEditor;
