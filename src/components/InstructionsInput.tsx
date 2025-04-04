import { Box, TextField, Chip, Stack } from "@mui/material";
import { useState } from "react";

interface InstructionsInputProps {
  onChange: (value: string) => void;
  mode: string;
}

export function InstructionsInput({ mode, onChange }: InstructionsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const userPrompts: string[] = [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
  };
  const label =
    mode === "talk"
      ? "Chat about your files"
      : "Describe what you want changed ";

  return (
    <Box sx={{ px: 2, pt: 2 }}>
      <TextField
        variant="outlined"
        fullWidth
        label={label}
        value={inputValue}
        onChange={handleInputChange}
        multiline
        minRows={4}
        maxRows={8}
        inputProps={{ style: { resize: "none" } }}
        InputLabelProps={{ shrink: true }}
      />
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        {userPrompts.map((prompt: string) => (
          <Chip
            key={prompt}
            label={prompt}
            onClick={() => {
              setInputValue(prompt);
              onChange(prompt);
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}
