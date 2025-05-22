import { Box, TextField } from "@mui/material";
import { useRef } from "react";
import useShortcut from "../utils/useShortcut";
import { useAppContext } from "../context/AppContext";
import { useUserContext } from "../context/UserContext";

export function InstructionsInput() {
  const { instructions, mode, setInstructions } = useAppContext();
  const { formatOutput } = useUserContext();
  const inputRef = useRef<HTMLInputElement>(null);
  useShortcut(
    "i",
    () => {
      if (inputRef.current) {
        inputRef.current.focus();
        if (inputRef.current.value) {
          inputRef.current.select();
        }
      }
    },
    {
      ctrlKey: true,
      metaKey: true,
    }
  );
  const label = formatOutput
    ? "Describe what you want to change."
    : "Talk about what you want to change";
  return (
    mode !== "do" && (
      <Box sx={{ px: 2, py: 2 }}>
        <TextField
          inputRef={inputRef}
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
