import { Box, TextField } from "@mui/material";
import { useAppContext } from "../context/AppContext";
import { useUserContext } from "../context/UserContext";

export function InstructionsInput() {
  const { instructions, mode, setInstructions } = useAppContext();
  const { formatOutput } = useUserContext();
  const label = formatOutput
    ? "Describe a feature to fix or a bug to create... wait"
    : "Chat about your files";
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
