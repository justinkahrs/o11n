import { Box, TextField, Chip, Stack } from "@mui/material";
import { useState } from "react";

interface InstructionsInputProps {
  onChange: (value: string) => void;
}

export function InstructionsInput({ onChange }: InstructionsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const userPrompts = ["web-app v2 (no nextjs)", "UI Overhaul", "Optimize Code"];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <Box sx={{ p: 2 }}>
      <TextField
        variant="outlined"
        fullWidth
        label="Enter your instructions..."
        value={inputValue}
        onChange={handleInputChange}
      />
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        {userPrompts.map(prompt => (
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