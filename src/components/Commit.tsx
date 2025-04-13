import { Button, CircularProgress } from "@mui/material";
import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { invoke } from "@tauri-apps/api/core";
import { Create } from "@mui/icons-material";
import type { FileNode } from "../types";

const Commit = () => {
  const [committing, setCommitting] = useState(false);
  const {
    plan,
    setMode,
    setPlan,
    selectedFiles,
    setSelectedFiles,
    setProjects,
  } = useAppContext();

  const handleCommit = async () => {
    setCommitting(true);
    try {
      const result = await invoke("apply_protocol", {
        xmlInput: plan,
      });
      console.log("Success:", result);
    } catch (error) {
      console.error("Failed to apply changes:", error);
    }
    setCommitting(false);
    setProjects((prev) =>
      prev.map((proj) => ({ ...proj, loadedChildren: false }))
    );
    if (plan.includes("### File") && plan.includes("### Action create")) {
      try {
        const regex =
          /### File\s+([^\n]+)[\s\S]+?### Action create[\s\S]+?\*\*Content\*\*:\s*\n\s*```(?:\w+)?\n([\s\S]*?)```/gi;
        const newFiles: FileNode[] = [];
        let match: RegExpExecArray | null;
        while (true) {
          match = regex.exec(plan);
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
    setMode("plan");
    setPlan("");
  };
  return (
    <Button
      fullWidth
      variant="contained"
      startIcon={
        committing ? <CircularProgress size={20} color="inherit" /> : <Create />
      }
      sx={{ mt: 2, width: "30%" }}
      onClick={handleCommit}
      disabled={committing}
    >
      {committing ? "Processing..." : "Commit Changes"}
    </Button>
  );
};

export default Commit;
