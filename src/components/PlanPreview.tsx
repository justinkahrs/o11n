import React from "react";
import { Box, Typography, List, ListItem } from "@mui/material";
import { useAppContext } from "../context/AppContext";

export function PlanPreview() {
  const { mode, plan } = useAppContext();

  const doMode = mode === "do";

  const { planDescription, changeDescriptions } = React.useMemo(() => {
    const planDescriptionMatch = plan.match(/# Plan\s*([\s\S]*?)\n## Files/);
    const planDescription = planDescriptionMatch
      ? planDescriptionMatch[1].trim()
      : "";
    const changeDescriptions: string[] = [];
    const regex = /\*\*Description\*\*:\s*(.*)/g;
    let match: RegExpExecArray | null = regex.exec(plan);
    while (match !== null) {
      if (match[1]) {
        changeDescriptions.push(match[1].trim());
      }
      match = regex.exec(plan);
    }
    return { planDescription, changeDescriptions };
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
                "No plan found, check that the formating starts with <pre>."}
            </Typography>
            {changeDescriptions.length > 0 && (
              <>
                <Typography color="secondary" variant="h6">
                  Change Descriptions
                </Typography>
                <List dense>
                  {changeDescriptions.map((desc, index) => (
                    <ListItem disableGutters key={index} sx={{ pl: 1 }}>
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
                </List>
              </>
            )}
          </>
        )}
      </Box>
    )
  );
}
