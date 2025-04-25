import { Box, TextField } from "@mui/material";
import { useAppContext } from "../context/AppContext";
import { useUserContext } from "../context/UserContext";

export function InstructionsInput() {
  const { instructions, mode, setInstructions } = useAppContext();
  const { formatOutput } = useUserContext();
  const label = formatOutput
    ? "Describe what you want to change."
    : "Talk about what you want to change";
  return (
    mode !== "do" && (
      <Box sx={{ px: 2, py: 2 }}>
        <TextField
          variant="outlined"
          fullWidth
          label={label}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          multiline
          minRows={4}
          maxRows={8}
          inputProps={{ style: { resize: "none" } }}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
    )
  );
}
