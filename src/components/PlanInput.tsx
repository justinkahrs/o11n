import { Box, TextField } from "@mui/material";
import { useState, useEffect } from "react";

interface PlanInputProps {
  plan: string;
  onChange: (value: string) => void;
}

export function PlanInput({ plan, onChange }: PlanInputProps) {
  const [inputValue, setInputValue] = useState(plan);

  useEffect(() => {
    setInputValue(plan);
  }, [plan]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <Box sx={{ p: 2 }}>
      <TextField
        variant="outlined"
        fullWidth
        label="Plan"
        value={inputValue}
        onChange={handleInputChange}
        multiline
        minRows={4}
        maxRows={8}
        inputProps={{ style: { resize: "none" } }}
        InputLabelProps={{ shrink: true }}
      />
    </Box>
  );
}
