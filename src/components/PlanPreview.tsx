import React from "react";
import { Box, Typography, List, ListItem } from "@mui/material";
import { useAppContext } from "../context/AppContext";
export function PlanPreview() {
  const { mode, plan } = useAppContext();
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
                  {fileChanges.map((fileChange) => (
                    <React.Fragment key={fileChange.file}>
                      <ListItem disableGutters>
                        <Typography variant="body1" color="primary">
                          {formatPath(fileChange.file)}
                        </Typography>
                      </ListItem>
                      {fileChange.descriptions.map((desc) => (
                        <ListItem disableGutters key={desc} sx={{ pl: 2 }}>
                          <Typography
                            color="secondary"
                            sx={{ display: "inline", width: "20px", mr: 1 }}
                          >
                            {"○ "}
                          </Typography>
                          <Typography variant="body2" component="span">
                            {desc}
                          </Typography>
                        </ListItem>
                      ))}
                    </React.Fragment>
                  ))}
                </List>
              </>
            )}
          </>
        )}
      </Box>
    )
  );
}
