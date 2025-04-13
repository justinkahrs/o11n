import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useAppContext } from "../context/AppContext";

const ModeButtons = () => {
  const { mode, setMode } = useAppContext();

  return (
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
  );
};
export default ModeButtons;
