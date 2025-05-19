import React from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import {
  Box,
  Typography,
  List,
  ListItem,
  Checkbox,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import { useAppContext } from "../context/AppContext";
import RetroButton from "./RetroButton";
import { Check } from "@mui/icons-material";

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
    file: string;
    idx: number;
  } | null>(null);
  const { planDescription } = React.useMemo(() => {
    const planDescriptionMatch = plan.match(/# Plan\s*([\s\S]*?)\n## Files/);
    const planDescription = planDescriptionMatch
      ? planDescriptionMatch[1].trim()
      : "";
    return { planDescription };
  }, [plan]);
  // Extract the raw change block for a given file and change index
  const getRawChangeBlock = (file: string, idx: number): string => {
    // Escape regex‐special characters in the file path
    const escapedFile = file.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

    // Grab that file’s section from the full plan
    const fileSectionRegex = new RegExp(
      `### File\\s+${escapedFile}[\\s\\S]*?(?=### File|$)`
    );
    const sectionMatch = plan.match(fileSectionRegex);
    if (!sectionMatch) return "";

    const fileSection = sectionMatch[0];

    // Find each “#### Change” block
    const changeBlocks =
      fileSection.match(/#### Change[\s\S]*?(?=#### Change|### File|$)/g) || [];
    const rawBlock = (changeBlocks[idx] || "").trim();

    // Regexes that ignore any language tag (e.g. "json") after the backticks
    const searchMatch = rawBlock.match(
      /\*\*Search\*\*:[\s\S]*?```(?:[^\n]*\n)?([\s\S]*?)```/
    );
    const contentMatch = rawBlock.match(
      /\*\*Content\*\*:[\s\S]*?```(?:[^\n]*\n)?([\s\S]*?)```/
    );
    // Handle create or rewrite blocks without search (new files)
    if (!searchMatch && contentMatch) {
      const newLines = contentMatch[1].trimEnd().split("\n");
      const diffLines = newLines.map((line) => `+ ${line}`);
      return diffLines.join("\n");
    }

    if (searchMatch && contentMatch) {
      const oldLines = searchMatch[1].trimEnd().split("\n");
      const newLines = contentMatch[1].trimEnd().split("\n");

      // Prefix removed lines with "-" and added lines with "+"
      const diffLines = [
        ...oldLines.map((line) => `- ${line}`),
        ...newLines.map((line) => `+ ${line}`),
      ];

      // Return just the lines themselves—no fences, no "diff" or language tag
      return diffLines.join("\n");
    }

    // Fallback to raw markdown if parsing fails
    return rawBlock;
  };
  // Compute syntax-highlighted diff HTML
  // biome-ignore lint/correctness/useExhaustiveDependencies: we need it for some reason
  const highlightedDiff = React.useMemo(() => {
    if (!openDiff) return "";
    const raw = getRawChangeBlock(openDiff.file, openDiff.idx);
    try {
      return hljs.highlight(raw, { language: "diff" }).value;
    } catch (error) {
      console.error("Error highlighting diff", error);
      return raw
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
  }, [openDiff, plan]);

  const fileChanges = React.useMemo(() => {
    const files = [];
    const fileRegex = /### File\s+(.+?)\n([\s\S]*?)(?=### File\s+|$)/g;
    let match: RegExpExecArray | null = fileRegex.exec(plan);
    while (match !== null) {
      const filePath = match[1].trim();
      const fileBlock = match[2];
      const descriptions: string[] = [];
      const descRegex = /\*\*Description\*\*:\s*(.*)/g;
      let descMatch: RegExpExecArray | null = descRegex.exec(fileBlock);
      while (descMatch !== null) {
        if (descMatch[1]) {
          descriptions.push(descMatch[1].trim());
        }
        descMatch = descRegex.exec(fileBlock);
      }
      files.push({ file: filePath, descriptions });
      match = fileRegex.exec(plan);
    }
    return files;
  }, [plan]);
  // Initialize each file's description selection (all checked by default)
  React.useEffect(() => {
    const initSelections: Record<string, boolean[]> = {};
    for (const fc of fileChanges) {
      initSelections[fc.file] = fc.descriptions.map(() => true);
    }
    setSelectedDescriptions(initSelections);
  }, [fileChanges, setSelectedDescriptions]);

  return (
    doMode && (
      <>
        <Box sx={{ overflowY: "auto", overflowX: "auto", p: 2 }}>
          {doMode && plan && (
            <>
              <Typography color="secondary" variant="h1" gutterBottom>
                Plan Overview
              </Typography>
              <Typography variant="body1" gutterBottom>
                {planDescription ||
                  "No plan found, check that the formating starts with ."}
              </Typography>
              {fileChanges.length > 0 && (
                <>
                  <Typography color="secondary" variant="h2">
                    Change Descriptions
                  </Typography>
                  <List dense>
                    {fileChanges.map((fileChange) => {
                      const fileSel =
                        selectedDescriptions[fileChange.file] || [];
                      const allChecked = fileSel.every(Boolean);
                      const fileError = errorReports.find(
                        (r) => r.path === fileChange.file
                      );
                      const fileSuccess = fileSuccesses.find(
                        (r) => r.path === fileChange.file
                      );
                      console.log({ fileError, fileSuccess });
                      return (
                        <React.Fragment key={fileChange.file}>
                          <ListItem
                            disableGutters
                            sx={{
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <Checkbox
                              checked={allChecked}
                              onChange={() => {
                                const newChecks = fileSel.map(
                                  () => !allChecked
                                );
                                setSelectedDescriptions({
                                  ...selectedDescriptions,
                                  [fileChange.file]: newChecks,
                                });
                              }}
                              size="small"
                              sx={{ mr: 1, p: 0 }}
                            />
                            <Typography variant="body1" color="primary">
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
                                sx={{ pl: 2 }}
                              >
                                <Checkbox
                                  checked={checked}
                                  onChange={() => {
                                    const fileSelInner =
                                      selectedDescriptions[fileChange.file] ||
                                      [];
                                    const newFileSelInner = [...fileSelInner];
                                    newFileSelInner[idx] =
                                      !newFileSelInner[idx];
                                    setSelectedDescriptions({
                                      ...selectedDescriptions,
                                      [fileChange.file]: newFileSelInner,
                                    });
                                  }}
                                  size="small"
                                  sx={{ mr: 1, p: 0 }}
                                />
                                <Typography
                                  variant="body2"
                                  component="span"
                                  sx={{
                                    textDecoration: checked
                                      ? "none"
                                      : "line-through",
                                    flex: 1,
                                  }}
                                >
                                  {desc}
                                </Typography>
                                <Tooltip
                                  arrow
                                  disableInteractive
                                  enterDelay={500}
                                  placement="left"
                                  title="Preview change"
                                >
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      setOpenDiff({
                                        file: fileChange.file,
                                        idx,
                                      })
                                    }
                                    sx={{ ml: 1 }}
                                  >
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
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
          <DialogContent dividers>
            <Box
              component="pre"
              sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                p: 1,
                backgroundColor: "white",
                borderRadius: 1,
                overflowX: "auto",
                userSelect: "text !important",
              }}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: required for syntax highlighting
              dangerouslySetInnerHTML={{ __html: highlightedDiff }}
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
    )
  );
}
