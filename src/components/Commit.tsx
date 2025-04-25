import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppContext } from "../context/AppContext";
import { CircularProgress, Grid, Typography } from "@mui/material";
import { Create } from "@mui/icons-material";
import RetroButton from "./RetroButton";
import type { FileNode } from "../types";
const Commit = () => {
  const [committing, setCommitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [commitFailed, setCommitFailed] = useState(false);
  const {
    plan,
    setMode,
    setPlan,
    selectedFiles,
    setSelectedFiles,
    setProjects,
    selectedDescriptions,
  } = useAppContext();
  const isPlanValid = () => {
    return (
      plan.trim() !== "" &&
      plan.includes("# Plan") &&
      plan.includes("### File") &&
      plan.includes("### Action")
    );
  };

  const handleCommit = async () => {
    setErrorMessage("");
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
        // biome-ignore lint/suspicious/noExplicitAny: idgaf right now
        const kept = blocks.filter((_b: any, idx: number) => selections[idx]);
        return `### File ${filePath}\n${preamble}${kept.join("")}`;
      });
    } catch (e) {
      console.error("Error filtering plan", e);
      planToApply = plan;
      throw e;
    }
    let commitError = false;
    try {
      const result = await invoke("apply_protocol", {
        xmlInput: planToApply,
      });
      console.log("Success:", result);
    } catch (error) {
      console.error("Failed to apply changes:", error);
      commitError = true;
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to apply changes"
      );
      throw error;
    }
    setCommitting(false);
    setProjects((prev) =>
      prev.map((proj) => ({ ...proj, loadedChildren: false }))
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
          newFiles.push({ id: filePath, name: fileName, path: filePath, size });
        }
        if (newFiles.length > 0) {
          setSelectedFiles((prev) => [...prev, ...newFiles]);
        }
      } catch (e) {
        console.error(
          "Error parsing new file creation instructions from markdown",
          e
        );
      }
    }
    if (!commitError) {
      setMode("plan");
      setPlan("");
    } else {
      setCommitFailed(true);
      setTimeout(() => setCommitFailed(false), 3000);
    }
  };

  return (
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
        {committing
          ? "Processing..."
          : commitFailed
          ? "Commit Failed!"
          : "Commit Changes"}
      </RetroButton>
      {errorMessage && (
        <Typography color="secondary" sx={{ mt: 1 }}>
          Check your plan formatting. o4-mini recommended. If this keeps
          happening, please file an issue with your instructions + plan{" "}
          <a
            href="https://github.com/justinkahrs/o11n/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </a>
          .
        </Typography>
      )}
    </Grid>
  );
};
export default Commit;
