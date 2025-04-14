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
      return "/" + segments.slice(-4).join("/");
    }
    return path;
  }
  const fileChanges = React.useMemo(() => {
    const files = [];
    const fileRegex = /### File\s+(.+?)\n([\s\S]*?)(?=### File\s+|$)/g;
    let match;
    while ((match = fileRegex.exec(plan)) !== null) {
      const filePath = match[1].trim();
      const fileBlock = match[2];
      const descriptions = [];
      const descRegex = /\*\*Description\*\*:\s*(.*)/g;
      let descMatch;
      while ((descMatch = descRegex.exec(fileBlock)) !== null) {
        if (descMatch[1]) {
          descriptions.push(descMatch[1].trim());
        }
      }
      files.push({ file: filePath, descriptions });
    }
    return files;
  }, [plan]);
  return (
    doMode && (
      <Box sx={{ p: 2 }}>
        {doMode && plan && (
          <>
            <Typography color="secondary" variant="h5" gutterBottom>
              Plan Overview
            </Typography>
            <Typography variant="body1" gutterBottom>
              {planDescription ||
                "No plan found, check that the formating starts with ."}
            </Typography>
            {fileChanges.length > 0 && (
              <>
                <Typography color="secondary" variant="h6">
                  Change Descriptions
                </Typography>
                <List dense>
                  {fileChanges.map((fileChange, index) => (
                    <React.Fragment key={index}>
                      <ListItem disableGutters>
                        <Typography variant="body1" color="primary">
                          {formatPath(fileChange.file)}
                        </Typography>
                      </ListItem>
                      {fileChange.descriptions.map((desc, idx) => (
                        <ListItem disableGutters key={idx} sx={{ pl: 2 }}>
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
