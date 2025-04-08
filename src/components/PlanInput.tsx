import { Box, TextField, IconButton, InputAdornment } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";

interface PlanInputProps {
  mode: "do" | "plan" | "talk";
  plan: string;
  onChange: (value: string) => void;
}

export function PlanInput({ mode, plan, onChange }: PlanInputProps) {
  const [inputValue, setInputValue] = useState(plan);
  const doMode = mode === "do";
  useEffect(() => {
    setInputValue(plan);
  }, [plan]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    doMode && (
      <Box sx={{ p: 2 }}>
        <TextField
          variant="outlined"
          fullWidth
          label="Paste plan here"
          value={inputValue}
          onChange={handleInputChange}
          multiline
          minRows={1}
          maxRows={1}
          inputProps={{ style: { resize: "none" } }}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: inputValue ? (
              <InputAdornment position="end">
                <IconButton
                  color="primary"
                  size="small"
                  onClick={() => {
                    setInputValue("");
                    onChange("");
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Box>
    )
  );
}
