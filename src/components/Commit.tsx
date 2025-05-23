import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  BaseDirectory,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { useAppContext } from "../context/AppContext";
import { useUserContext } from "../context/UserContext";
import { CircularProgress, Grid } from "@mui/material";
import { Create } from "@mui/icons-material";
import RetroButton from "./RetroButton";
import type { ErrorReport, FileNode, SuccessReport } from "../types";
import useShortcut from "../utils/useShortcut";
import Toast from "./Toast";
import { formatWithPrettier } from "../utils/formatWithPrettier";

const Commit = () => {
  const [committing, setCommitting] = useState(false);
  const [commitFailed, setCommitFailed] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const handleToastClose = () => {
    setToastOpen(false);
  };
  const {
    configFiles,
    plan,
    selectedFiles,
    setSelectedFiles,
    setProjects,
    projects,
    selectedDescriptions,
    setErrorReports,
    setFileSuccesses,
  } = useAppContext();
  const { showShortcuts } = useUserContext();
  const isPlanValid = () => {
    return (
      plan.trim() !== "" &&
      plan.includes("### File") &&
      plan.includes("### Action")
    );
  };

  const handleCommit = async () => {
    setCommitting(true);
    // Filter plan according to selected descriptions
    let planToApply = plan;
    try {
      const fileRegex = /### File\s+(.+?)\n([\s\S]*?)(?=### File\s+|$)/g;
      planToApply = plan.replace(fileRegex, (_full, filePath, fileBlock) => {
        const selections = selectedDescriptions[filePath.trim()] || [];
        // separate preamble before first change
        const firstChangeIdx = fileBlock.indexOf("#### Change");
        const preamble =
          firstChangeIdx !== -1
            ? fileBlock.slice(0, firstChangeIdx)
            : fileBlock;
        // collect change blocks
        const changeRegex = /#### Change[\s\S]*?(?=#### Change|$)/g;
        const blocks = fileBlock.match(changeRegex) || [];
        const kept =
          Array.isArray(selections) && selections.length > 0
            ? // biome-ignore lint/suspicious/noExplicitAny: idgaf right now
              blocks.filter((_b: any, idx: number) => selections[idx])
            : blocks;
        return `### File ${filePath}\n${preamble}${kept.join("")}`;
      });
    } catch (e) {
      console.error("Error filtering plan", e);
      planToApply = plan;
    }
    let commitError = false;
    try {
      // Gather changed file paths for formatting
      const changedFilePaths: string[] = [];
      // Start of Selection
      const filePathRegex = /### File\s+(.+?)\n/g;
      for (const fileMatch of planToApply.matchAll(filePathRegex)) {
        changedFilePaths.push(fileMatch[1].trim());
      }
      const { errors, success } = await invoke<{
        errors: ErrorReport[];
        success: SuccessReport[];
      }>("apply_protocol", {
        xmlInput: planToApply,
      });
      for (const file of success) {
        try {
          const fileContent = await readTextFile(file.path);
          const formatted = await formatWithPrettier(
            fileContent,
            file.path,
            configFiles,
          );

          await writeTextFile(file.path, formatted, {
            baseDir: BaseDirectory.Home,
          });
        } catch (e) {
          console.error("Prettier format failed for", file.path, e);
        }
      }
      setFileSuccesses(success);
      setErrorReports(errors);
    } catch (error) {
      console.error("Failed to apply changes:", error);
      commitError = true;
    } finally {
      setCommitting(false);
    }
    setProjects((prev) =>
      prev.map((proj) => ({ ...proj, loadedChildren: false })),
    );
    if (
      planToApply.includes("### File") &&
      planToApply.includes("### Action create")
    ) {
      try {
        const regex =
          /### File\s+([^\n]+)[\s\S]+?### Action create[\s\S]+?\*\*Content\*\*:\s*\n\s*```(?:\w+)?\n([\s\S]*?)```/gi;
        const newFiles: FileNode[] = [];
        let match: RegExpExecArray | null;
        while (true) {
          match = regex.exec(planToApply);
          if (match === null) break;
          const filePath = match[1].trim();
          // Check for duplicate files based on file path
          if (selectedFiles.some((f) => f.path === filePath)) {
            continue;
          }
          const fileContent = match[2];
          // Calculate size in MB similarly to DirectoryView using TextEncoder
          const sizeInBytes = new TextEncoder().encode(fileContent).length;
          const size = sizeInBytes / (1024 * 1024);
          const parts = filePath.split("/");
          const fileName = parts[parts.length - 1] || "New File";
          const project = projects.find((p) => filePath.startsWith(p.path));
          const projectRoot = project ? project.path : "";
          newFiles.push({
            id: filePath,
            name: fileName,
            path: filePath,
            size,
            projectRoot,
          });
        }
        if (newFiles.length > 0) {
          setSelectedFiles((prev) => [...prev, ...newFiles]);
        }
      } catch (e) {
        console.error(
          "Error parsing new file creation instructions from markdown",
          e,
        );
      }
    }
    if (!commitError) {
      setToastOpen(true);
    } else {
      setCommitFailed(true);
      setTimeout(() => setCommitFailed(false), 3000);
    }
  };

  useShortcut("Enter", handleCommit, { targetSelector: "#plan-input" });
  return (
    <>
      <Grid container spacing={1} direction="column">
        <RetroButton
          disabled={committing || !isPlanValid()}
          onClick={handleCommit}
          startIcon={
            committing ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Create />
            )
          }
          sx={{ mx: 2, width: "220px" }}
        >
          {committing ? (
            "Processing..."
          ) : commitFailed ? (
            "Commit Failed!"
          ) : showShortcuts ? (
            <>Commit Changes (Enter)</>
          ) : (
            "Commit Changes"
          )}
        </RetroButton>
      </Grid>
      <Toast
        open={toastOpen}
        message="Changes applied successfully!"
        onClose={handleToastClose}
      />
    </>
  );
};
export default Commit;
