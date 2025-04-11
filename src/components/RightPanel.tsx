import {
  Button,
  CircularProgress,
  Grid,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useAppContext } from "../context/AppContext";
import { InstructionsInput } from "./InstructionsInput";
import TemplateSelection from "./TemplateSelection";
import { PlanInput } from "./PlanInput";
import { PlanPreview } from "./PlanPreview";
import { type FileNode, SelectedFiles } from "./SelectedFiles";
import { Create } from "@mui/icons-material";
import Copy from "./Copy";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

const RightPanel = () => {
  const {
    plan,
    setPlan,
    customTemplates,
    setCustomTemplates,
    mode,
    setMode,
    instructions,
    setInstructions,
  } = useAppContext();
  const [committing, setCommitting] = useState(false);
  const { selectedFiles, setSelectedFiles, setProjects } = useAppContext();
  function handleRemoveFile(fileId: string) {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== fileId));
  }
  function handleRemoveFolder(folderPath: string) {
    setSelectedFiles((prev) =>
      prev.filter((file) => {
        const lastSlash = file.path.lastIndexOf("/");
        const fileFolder =
          lastSlash !== -1 ? file.path.substring(0, lastSlash) : "Root";
        return fileFolder !== folderPath;
      })
    );
  }
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
    <div style={{ flexGrow: 1 }}>
      <Grid
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
        justifyContent="space-between"
      >
        <Stack
          sx={{
            width: "100%",
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
          alignContent="space-between"
        >
          <>
            <ToggleButtonGroup
              color="primary"
              value={mode}
              exclusive
              onChange={(_e, newMode) => {
                if (newMode !== null) setMode(newMode);
              }}
              sx={{ m: 2 }}
            >
              <ToggleButton size="small" value="plan">
                Let's plan
              </ToggleButton>
              <ToggleButton size="small" value="do">
                Let's do it
              </ToggleButton>
            </ToggleButtonGroup>
            {mode !== "do" && (
              <InstructionsInput
                mode={mode}
                value={instructions}
                onChange={setInstructions}
              />
            )}
            <TemplateSelection
              mode={mode}
              templates={customTemplates}
              onAddTemplate={(template) =>
                setCustomTemplates((prev) => [...prev, template])
              }
              onRemoveTemplate={(id) =>
                setCustomTemplates((prev) => prev.filter((t) => t.id !== id))
              }
              onToggleTemplate={(id) =>
                setCustomTemplates((prev) =>
                  prev.map((t) =>
                    t.id === id ? { ...t, active: !t.active } : t
                  )
                )
              }
            />
            <PlanInput mode={mode} plan={plan} onChange={setPlan} />
            <PlanPreview mode={mode} plan={plan} />
            <SelectedFiles
              mode={mode}
              plan={plan}
              files={selectedFiles}
              onRemoveFile={handleRemoveFile}
              onRemoveFolder={handleRemoveFolder}
            />
          </>
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          sx={{ mt: 2 }}
          justifyContent={mode === "do" ? "flex-end" : "space-between"}
        >
          {mode === "do" ? (
            <>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Create />}
                sx={{
                  display: "none",
                  mt: 2,
                  width: "30%",
                }} /* hiding for now */
                // onClick={handleRevert}
              >
                Revert Changes
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={
                  committing ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Create />
                  )
                }
                sx={{ mt: 2, width: "30%" }}
                onClick={handleCommit}
                disabled={committing}
              >
                {committing ? "Processing..." : "Commit Changes"}
              </Button>
            </>
          ) : (
            <>
              <Copy
                files={selectedFiles}
                userInstructions={instructions}
                customTemplates={customTemplates}
                isTalkMode={mode === "talk"}
              />
            </>
          )}
        </Stack>
      </Grid>
    </div>
  );
};
export default RightPanel;
