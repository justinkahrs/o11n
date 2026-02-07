import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  Checkbox,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAppContext } from "../context/AppContext";
import RetroButton from "./RetroButton";
import { Check } from "@mui/icons-material";
import MonacoEditor from "./MonacoEditor";

export function PlanPreview() {
  const {
    selectedDescriptions,
    setSelectedDescriptions,
    mode,
    plan,
    errorReports,
    fileSuccesses,
  } = useAppContext();
  const doMode = mode === "do";
  const [openDiff, setOpenDiff] = React.useState<{
    original: string;
    modified: string;
  } | null>(null);

  const { planDescription } = React.useMemo(() => {
    const planDescriptionMatch = plan.match(/# Plan\s*([\s\S]*?)\n## Files/);
    const planDescription = planDescriptionMatch
      ? planDescriptionMatch[1].trim()
      : "";
    return { planDescription };
  }, [plan]);

  // Extract original and modified code for a file change
  const getChangeBlock = (
    file: string,
    idx: number,
  ): { original: string; modified: string } => {
    const escapedFile = file.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const fileSectionRegex = new RegExp(
      `### File\\s+${escapedFile}[\\s\\S]*?(?=### File|$)`,
    );
    const sectionMatch = plan.match(fileSectionRegex);
    if (!sectionMatch) {
      return { original: "", modified: "" };
    }
    const fileSection = sectionMatch[0];
    const changeBlocks =
      fileSection.match(/#### Change[\s\S]*?(?=#### Change|### File|$)/g) || [];
    const rawBlock = (changeBlocks[idx] || "").trim();
    const searchMatch = rawBlock.match(
      /\*\*Search\*\*:[\s\S]*?```(?:[^\n]*\n)?([\s\S]*?)```/,
    );
    const contentMatch = rawBlock.match(
      /\*\*Content\*\*:[\s\S]*?```(?:[^\n]*\n)?([\s\S]*?)```/,
    );
    if (!searchMatch && contentMatch) {
      const newLines = contentMatch[1].trimEnd().split("\n");
      return { original: "", modified: newLines.join("\n") };
    }
    if (searchMatch && contentMatch) {
      const oldLines = searchMatch[1].trimEnd().split("\n");
      const newLines = contentMatch[1].trimEnd().split("\n");
      return { original: oldLines.join("\n"), modified: newLines.join("\n") };
    }
    return { original: "", modified: rawBlock };
  };

  // Parse file changes and descriptions
  const fileChanges = React.useMemo(() => {
    const files: { file: string; descriptions: string[] }[] = [];
    const fileRegex = /### File\s+(.+?)\n([\s\S]*?)(?=### File\s+|$)/g;
    let match: RegExpExecArray | null = fileRegex.exec(plan);
    while (match) {
      const filePath = match[1].trim();
      const fileBlock = match[2];
      const descriptions: string[] = [];
      const descRegex = /\*\*Description\*\*:\s*(.*)/g;
      let descMatch: RegExpExecArray | null = descRegex.exec(fileBlock);
      while (descMatch) {
        if (descMatch[1]) descriptions.push(descMatch[1].trim());
        descMatch = descRegex.exec(fileBlock);
      }
      files.push({ file: filePath, descriptions });
      match = fileRegex.exec(plan);
    }
    return files;
  }, [plan]);

  // Initialize selection state
  React.useEffect(() => {
    const init: Record<string, boolean[]> = {};
    for (const fc of fileChanges) {
      init[fc.file] = fc.descriptions.map(() => true);
    }
    setSelectedDescriptions(init);
  }, [fileChanges, setSelectedDescriptions]);

  return (
    <>
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          overflowY: "auto",
          overflowX: "auto",
          p: 2,
          width: "100%",
        }}
      >
        {doMode && (
          <>
            {planDescription && (
              <>
                <Typography color="secondary" variant="h1" gutterBottom>
                  Plan Overview
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {planDescription}
                </Typography>
              </>
            )}
            {fileChanges.length > 0 && (
              <>
                <Typography color="secondary" variant="h2">
                  Change Descriptions
                </Typography>
                <List dense>
                  {fileChanges.map((fileChange) => {
                    const fileSel = selectedDescriptions[fileChange.file] || [];
                    const allChecked = fileSel.every(Boolean);
                    const fileError = errorReports.find(
                      (r) => r.path === fileChange.file,
                    );
                    const fileSuccess = fileSuccesses.find(
                      (r) => r.path === fileChange.file,
                    );
                    return (
                      <React.Fragment key={fileChange.file}>
                        <ListItem disableGutters>
                          <Checkbox
                            checked={allChecked}
                            onChange={() => {
                              const toggled = fileSel.map(() => !allChecked);
                              setSelectedDescriptions({
                                ...selectedDescriptions,
                                [fileChange.file]: toggled,
                              });
                            }}
                            size="small"
                            sx={{ mr: 1, p: 0 }}
                          />
                          <Typography
                            variant="body1"
                            color="primary"
                            sx={{
                              width: "100%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {fileChange.file}
                          </Typography>
                          {fileError && (
                            <Tooltip
                              title={fileError.messages?.join("\n")}
                              arrow
                            >
                              <CloseIcon
                                color="error"
                                fontSize="small"
                                sx={{ ml: 1 }}
                              />
                            </Tooltip>
                          )}
                          {fileSuccess && (
                            <Tooltip
                              title={fileSuccess.messages?.join("\n")}
                              arrow
                            >
                              <Check
                                color="success"
                                fontSize="small"
                                sx={{ ml: 1 }}
                              />
                            </Tooltip>
                          )}
                        </ListItem>
                        {fileChange.descriptions.map((desc, idx) => {
                          const checked =
                            selectedDescriptions[fileChange.file]?.[idx] ??
                            true;
                          return (
                            <ListItem
                              disableGutters
                              key={`${fileChange.file}-${idx}`}
                              sx={{ ml: 2 }}
                            >
                              <Checkbox
                                checked={checked}
                                onChange={() => {
                                  const inner = [
                                    ...(selectedDescriptions[fileChange.file] ||
                                      []),
                                  ];
                                  inner[idx] = !inner[idx];
                                  setSelectedDescriptions({
                                    ...selectedDescriptions,
                                    [fileChange.file]: inner,
                                  });
                                }}
                                size="small"
                                sx={{ mr: 1, p: 0 }}
                              />
                              <Typography
                                variant="body2"
                                component="span"
                                onClick={() => {
                                  const { original, modified } = getChangeBlock(
                                    fileChange.file,
                                    idx,
                                  );
                                  setOpenDiff({ original, modified });
                                }}
                                sx={{
                                  cursor: "pointer",
                                  textDecoration: checked
                                    ? "none"
                                    : "line-through",
                                  "&:hover": { textDecoration: "underline" },
                                  flex: 1,
                                  wordBreak: "break-word",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {desc}
                              </Typography>
                            </ListItem>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </List>
              </>
            )}
          </>
        )}
      </Box>
      <Dialog
        open={Boolean(openDiff)}
        onClose={() => setOpenDiff(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Change Details</DialogTitle>
        <DialogContent dividers sx={{ height: "60vh", p: 0 }}>
          <MonacoEditor
            isDiff
            language="diff"
            originalValue={openDiff?.original || ""}
            value={openDiff?.modified || ""}
          />
        </DialogContent>
        <DialogActions>
          <RetroButton
            onClick={() => setOpenDiff(null)}
            sx={{ height: 40, m: 1 }}
            variant="outlined"
          >
            Close
          </RetroButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
