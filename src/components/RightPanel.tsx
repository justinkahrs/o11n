import { Grid, Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useAppContext } from "../context/AppContext";
import { InstructionsInput } from "./InstructionsInput";
import TemplateSelection from "./TemplateSelection";
import { PlanInput } from "./PlanInput";
import { PlanPreview } from "./PlanPreview";
import { SelectedFiles } from "./SelectedFiles";
import Copy from "./Copy";
import Commit from "./Commit";

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
  const { selectedFiles } = useAppContext();

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
            <PlanInput />
            <PlanPreview />
            <SelectedFiles />
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
              <Commit />
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
