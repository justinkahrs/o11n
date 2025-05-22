import { Box, TextField, IconButton, InputAdornment } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect, useRef } from "react";
import useShortcut from "../utils/useShortcut";
import { useAppContext } from "../context/AppContext";
import { useUserContext } from "../context/UserContext";

export function PlanInput() {
  const { mode, plan, setErrorReports, setFileSuccesses, setMode, setPlan } =
    useAppContext();
  const { formatOutput } = useUserContext();
  const [inputValue, setInputValue] = useState(plan);
  const inputRef = useRef<HTMLInputElement>(null);
  const doMode = mode === "do";

  useEffect(() => {
    setInputValue(plan);
  }, [plan]);

  useEffect(() => {
    if (!formatOutput) setMode("plan");
  }, [formatOutput, setMode]);

  useEffect(() => {
    if (doMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [doMode]);
  const clearPlan = () => {
    setInputValue("");
    setPlan("");
    setErrorReports([]);
    setFileSuccesses([]);
  };
  useShortcut(
    "N",
    () => {
      clearPlan();
      setMode("plan");
    },
    {
      ctrlKey: true,
      metaKey: true,
      shiftKey: true,
      targetSelector: "#plan-input",
    }
  );
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setPlan(e.target.value);
  };

  return (
    doMode && (
      <Box sx={{ p: 2, width: "100%" }}>
        <TextField
          id="plan-input"
          inputRef={inputRef}
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
                <IconButton color="primary" size="small" onClick={clearPlan}>
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
