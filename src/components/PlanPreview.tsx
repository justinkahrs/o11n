import React from "react";
import { Box, Typography, List, ListItem, Checkbox } from "@mui/material";
import { useAppContext } from "../context/AppContext";
export function PlanPreview() {
  const { selectedDescriptions, setSelectedDescriptions, mode, plan } = useAppContext();
  const doMode = mode === "do";
  const { planDescription } = React.useMemo(() => {
    const planDescriptionMatch = plan.match(/# Plan\s*([\s\S]*?)\n## Files/);
    const planDescription = planDescriptionMatch
      ? planDescriptionMatch[1].trim()
      : "";
    return { planDescription };
  }, [plan]);
  function formatPath(path: string): string {
    const projectsIndex = path.indexOf("/Projects/");
    if (projectsIndex !== -1) {
      return path.substring(projectsIndex + "/Projects".length);
    }
    const segments = path.split("/").filter(Boolean);
    if (segments.length >= 4) {
      return `/${segments.slice(-4).join("/")}`;
    }
    return path;
  }
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
    fileChanges.forEach((fc) => {
      initSelections[fc.file] = fc.descriptions.map(() => true);
    });
    setSelectedDescriptions(initSelections);
  }, [fileChanges, setSelectedDescriptions]);
  return (
    doMode && (
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
                    const fileSel = selectedDescriptions[fileChange.file] || [];
                    const allChecked = fileSel.every(Boolean);
                    return (
                      <React.Fragment key={fileChange.file}>
                        <ListItem
                          disableGutters
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            '&:hover .fileHeaderCheckbox': { visibility: 'visible' },
                          }}
                        >
                          <Checkbox
                            className="fileHeaderCheckbox"
                            checked={allChecked}
                            onChange={() => {
                              const newChecks = fileSel.map(() => !allChecked);
                              setSelectedDescriptions({
                                ...selectedDescriptions,
                                [fileChange.file]: newChecks,
                              });
                            }}
                            size="small"
                            sx={{ visibility: 'hidden', mr: 1, p: 0 }}
                          />
                          <Typography variant="body1" color="primary">
                            {formatPath(fileChange.file)}
                          </Typography>
                        </ListItem>
                        {fileChange.descriptions.map((desc, idx) => {
                          const checked = selectedDescriptions[fileChange.file]?.[idx] ?? true;
                          return (
                            <ListItem disableGutters key={`${fileChange.file}-${idx}`} sx={{ pl: 2 }}>
                              <Checkbox
                                checked={checked}
                                onChange={() => {
                                  const fileSelInner = selectedDescriptions[fileChange.file] || [];
                                  const newFileSelInner = [...fileSelInner];
                                  newFileSelInner[idx] = !newFileSelInner[idx];
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
                                sx={{ textDecoration: checked ? 'none' : 'line-through' }}
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
    )
  );
}
