import React, { useRef, useEffect, useState } from "react";
import * as monaco from "monaco-editor";
import { useAppContext } from "../context/AppContext";
import { useUserContext } from "../context/UserContext";
import { readTextFile } from "@tauri-apps/plugin-fs";
import "monaco-editor/min/vs/editor/editor.main.css";
import { invoke } from "@tauri-apps/api/core";
import { diffLines } from "diff";
import "./MonacoEditor.css";
import JSON5 from "json5";

interface MonacoEditorProps {
  value?: string;
  language?: string;
  onChange?: (value: string) => void;
  isDiff?: boolean;
  originalValue?: string;
  filePath?: string;
}
const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value = "",
  language = "javascript",
  onChange,
  isDiff = false,
  originalValue = "",
  filePath,
}) => {
  const { configFiles } = useAppContext();
  const { themeMode } = useUserContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<
    monaco.editor.IStandaloneCodeEditor | monaco.editor.IDiffEditor
  >();
  const originalModelRef = useRef<monaco.editor.ITextModel | null>(null);
  const modifiedModelRef = useRef<monaco.editor.ITextModel | null>(null);

  // Git diff state
  const [gitOriginalContent, setGitOriginalContent] = useState<string | null>(
    null,
  );
  const [decorations, setDecorations] = useState<string[]>([]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: editor flickers if we give it more deps
  useEffect(() => {
    if (!containerRef.current) return;

    if (isDiff) {
      const diffEditor = monaco.editor.createDiffEditor(containerRef.current, {
        automaticLayout: true,
        minimap: { enabled: false },
        theme: themeMode === "dark" ? "vs-dark" : "vs",
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
      theme: themeMode === "dark" ? "vs-dark" : "vs",
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
  // Update theme when themeMode changes
  useEffect(() => {
    monaco.editor.setTheme(themeMode === "dark" ? "vs-dark" : "vs");
  }, [themeMode]);
  // Load tsconfig compilerOptions from context into Monaco
  useEffect(() => {
    const tsConfigFile = configFiles?.find((c) => c.name === "tsconfig.json");
    if (!tsConfigFile) {
      // Disable JS/TS syntax and error highlighting when no tsconfig is present
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSyntaxValidation: true,
        noSemanticValidation: true,
      });
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSyntaxValidation: true,
        noSemanticValidation: true,
      });
      return;
    }
    readTextFile(tsConfigFile.path)
      .then((file) => {
        // Handle response which might be a string or an object with a 'text' property
        const text = typeof file === "string" ? file : (file as any).text;
        try {
          const parsed = JSON5.parse(text);
          if (parsed.compilerOptions) {
            monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
              parsed.compilerOptions,
            );
          }
        } catch (e) {
          console.error("Failed to parse tsconfig.json", e);
        }
      })
      .catch((err) => console.error("Error reading tsconfig.json", err));
  }, [configFiles]);

  // Git integration
  // Ref to store git content for the action closure
  const gitOriginalContentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!filePath) {
      setGitOriginalContent(null);
      gitOriginalContentRef.current = null;
      return;
    }

    invoke("get_git_original_content", { path: filePath })
      .then((content) => {
        const c = content as string;
        setGitOriginalContent(c);
        gitOriginalContentRef.current = c;
      })
      .catch(() => {
        // console.warn("Git not available or file not tracked", e);
        setGitOriginalContent(null);
        gitOriginalContentRef.current = null;
      });
  }, [filePath]);

  useEffect(() => {
    const editor = editorRef.current as monaco.editor.IStandaloneCodeEditor;
    if (isDiff || !editor || !editor.getModel()) return;

    if (!gitOriginalContent) {
      const newDecorations = editor.deltaDecorations(decorations, []);
      setDecorations(newDecorations);
      return;
    }

    const changes = diffLines(gitOriginalContent, value, {
      newlineIsToken: false,
    });
    const newDecorationsOpts: monaco.editor.IModelDeltaDecoration[] = [];

    let currentLine = 1;

    // We also want to track original lines to support revert (mapping current ranges to original ranges)
    // But for revert action, we might just re-diff inside the action or use a simpler approach.
    // For visual decorations:

    changes.forEach((change) => {
      const count = change.count || 0;
      if (change.added) {
        // Added lines: highlight gutter green
        newDecorationsOpts.push({
          range: new monaco.Range(currentLine, 1, currentLine + count - 1, 1),
          options: {
            isWholeLine: true,
            linesDecorationsClassName: "git-added-gutter", // CSS class for gutter
            className: "git-added-line-content", // CSS class for line background
            hoverMessage: { value: "Git: Added lines" },
          },
        });
        currentLine += count;
      } else if (change.removed) {
        // Removed lines: show marker at currentLine
        // Since the lines are gone, we mark the line where they *would* be (currentLine)
        // If we are at the end of file, we mark the last line.
        // Actually, for removal, usually we want a small triangle or marker.
        // We'll use a gutter decoration on the line *before* the removal (or after if at start).
        // But for simplicity, let's just mark the current line gutter distinctively.
        // Wait, if I remove lines 10-15.
        // `currentLine` is 10 (which is now the old 16).
        // So I mark line 10 as "content removed before this".
        newDecorationsOpts.push({
          range: new monaco.Range(currentLine, 1, currentLine, 1),
          options: {
            isWholeLine: false, // Don't highlight whole line content, just gutter
            linesDecorationsClassName: "git-removed-gutter",
            hoverMessage: { value: `Git: Removed ${count} lines here` },
          },
        });
        // Removed lines are NOT in the editor, so currentLine doesn't increment.
      } else {
        // Unchanged
        currentLine += count;
      }
    });

    const newDecIds = editor.deltaDecorations(decorations, newDecorationsOpts);
    setDecorations(newDecIds);
  }, [value, gitOriginalContent, isDiff]); // Re-run when value changes

  // Add "Revert" action
  useEffect(() => {
    const editor = editorRef.current as monaco.editor.IStandaloneCodeEditor;
    if (isDiff || !editor) return;

    // We add the action once. But we need it to use the latest gitContent.
    // We use gitOriginalContentRef.
    const actionId = editor.addAction({
      id: "git.revertChange",
      label: "Revert Change",
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.5,
      run: (ed) => {
        const originalText = gitOriginalContentRef.current;
        if (!originalText) return;

        const position = ed.getPosition();
        if (!position) return;

        const currentModel = ed.getModel();
        if (!currentModel) return;

        const currentText = currentModel.getValue();

        // We need to identify which change the cursor is in.
        // Re-run diff to find the hunk.
        const changes = diffLines(originalText, currentText, {
          newlineIsToken: false,
        });

        let line = 1;

        // Find the change corresponding to `position.lineNumber`
        for (let i = 0; i < changes.length; i++) {
          const change = changes[i];
          const count = change.count || 0;

          if (change.added) {
            const start = line;
            const end = line + count - 1;

            if (position.lineNumber >= start && position.lineNumber <= end) {
              // Check for modification (preceded by removal)
              const prev = i > 0 ? changes[i - 1] : null;
              let textToRestore = "";
              if (prev && prev.removed) {
                textToRestore = prev.value;
              }

              // Replace the Added range with textToRestore (revert modification)
              // or empty string (revert addition)

              const range = new monaco.Range(start, 1, end + 1, 1);
              // Safe approach: delete lines or replace them.

              ed.executeEdits("git.revert", [
                {
                  range: range,
                  text: textToRestore,
                  forceMoveMarkers: true,
                },
              ]);
              return;
            }
            line += count;
          } else if (change.removed) {
            // If cursor is at the removal point and it's a PURE removal (not modification)
            // We can check if next is added. If so, let 'added' block handle it as modification.
            const next = i + 1 < changes.length ? changes[i + 1] : null;
            if (next && next.added) {
              // Skip, will be handled by Added block
              continue;
            }

            // Pure removal at 'line'.
            if (position.lineNumber === line) {
              // Revert deletion: insert the removed text
              ed.executeEdits("git.revert", [
                {
                  range: new monaco.Range(line, 1, line, 1),
                  text: change.value,
                  forceMoveMarkers: true,
                },
              ]);
              return;
            }
            // Removed lines are not in editor, so don't increment line
          } else {
            // Unchanged
            line += count;
          }
        }
      },
    });

    return () => {
      // Clean up action?
      // dispose() is on the action reference, but addAction returns IDisposable.
      actionId.dispose();
    };
  }, [isDiff]); // Runs once when editor created (ish), dependencies minimal.

  // Update theme when themeMode changes
  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", border: "1px solid #ddd" }}
    />
  );
};
export default MonacoEditor;
