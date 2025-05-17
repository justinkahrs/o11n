import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppContext } from "../context/AppContext";
import { CircularProgress, Grid } from "@mui/material";
import { Create } from "@mui/icons-material";
import RetroButton from "./RetroButton";
import type { ErrorReport, FileNode } from "../types";

const Commit = () => {
  const [committing, setCommitting] = useState(false);
  const [commitFailed, setCommitFailed] = useState(false);
  const {
    plan,
    setMode,
    setPlan,
    selectedFiles,
    setSelectedFiles,
    setProjects,
    selectedDescriptions,
    setErrorReports,
    setFileSuccesses,
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
    }
    let commitError = false;
    try {
      const result = await invoke<string>("apply_protocol", {
        xmlInput: planToApply,
      });
      console.log({ result });
      // setFileSuccesses(file_success);
      // setErrorReports(file_errors);
      console.log("Success:", result);
    } catch (error) {
      try {
        const parsed = JSON.parse(error as string) as ErrorReport[];
        setErrorReports(parsed);
      } catch {
        setErrorReports([
          { path: "unknown", messages: [(error as string).toString()] },
        ]);
      }
      console.error("Failed to apply changes:", error);
      commitError = true;
    } finally {
      setCommitting(false);
    }
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
    </Grid>
  );
};
export default Commit;
