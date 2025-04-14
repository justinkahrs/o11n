import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useAppContext } from "../context/AppContext";
import { useUserContext } from "../context/UserContext";

const ModeButtons = () => {
  const { mode, setMode } = useAppContext();
  const { formatOutput } = useUserContext();

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
      {formatOutput && (
        <ToggleButton size="small" value="do">
          Let's do it
        </ToggleButton>
      )}
    </ToggleButtonGroup>
  );
};
export default ModeButtons;
