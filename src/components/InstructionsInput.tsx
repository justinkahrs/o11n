import { Box, TextField } from "@mui/material";
import { KeyboardCommandKey } from "@mui/icons-material";
import { platform } from "@tauri-apps/plugin-os";
import { useRef, useEffect } from "react";
import useShortcut from "../utils/useShortcut";
import { useAppContext } from "../context/AppContext";
import { useUserContext } from "../context/UserContext";

export function InstructionsInput() {
  const { instructions, mode, setInstructions } = useAppContext();
  const { formatOutput, showShortcuts } = useUserContext();
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
  useShortcut("N", () => setInstructions(""), {
    ctrlKey: true,
    metaKey: true,
    shiftKey: true,
  });
  useEffect(() => {
    if (mode === "plan" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);
  const cmd =
    platform() === "macos" ? (
      <>
        (
        <KeyboardCommandKey
          sx={{
            paddingTop: "2px",
            fontSize: "14px",
          }}
        />
        + i )
      </>
    ) : (
      "Ctrl + I"
    );
  const label = formatOutput ? (
    <>Describe the change.{showShortcuts && <> {cmd}</>}</>
  ) : (
    "Talk about what you want to change"
  );

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
