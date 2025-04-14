import { Box, TextField, IconButton, InputAdornment } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { useUserContext } from "../context/UserContext";

export function PlanInput() {
  const { mode, plan, setMode, setPlan } = useAppContext();
  const { formatOutput } = useUserContext();
  const [inputValue, setInputValue] = useState(plan);
  const doMode = mode === "do";

  useEffect(() => {
    setInputValue(plan);
  }, [plan]);

  useEffect(() => {
    if (!formatOutput) setMode("plan");
  }, [formatOutput, setMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setPlan(e.target.value);
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
            startAdornment: inputValue ? (
              <InputAdornment position="start">
                <IconButton
                  color="primary"
                  size="small"
                  onClick={() => {
                    setInputValue("");
                    setPlan("");
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
