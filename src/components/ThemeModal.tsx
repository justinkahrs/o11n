import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  useTheme,
} from "@mui/material";

type ThemeModalProps = {
  open: boolean;
  onClose: () => void;
  onApply: (primary: string, secondary: string, mode: "light" | "dark") => void;
};

export default function ThemeModal({
  open,
  onClose,
  onApply,
}: ThemeModalProps) {
  const theme = useTheme();
  const [primaryColor, setPrimaryColor] = useState(theme.palette.primary.main);
  const [secondaryColor, setSecondaryColor] = useState(
    theme.palette.secondary.main
  );
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Configure Theme</DialogTitle>
      <DialogContent>
        <TextField
          label="Primary Color"
          type="color"
          value={primaryColor}
          onChange={(e) => setPrimaryColor(e.target.value)}
          margin="normal"
          fullWidth
        />
        <TextField
          label="Secondary Color"
          type="color"
          value={secondaryColor}
          onChange={(e) => setSecondaryColor(e.target.value)}
          margin="normal"
          fullWidth
        />
        <FormControlLabel
          control={
            <Switch
              checked={isDarkMode}
              onChange={(e) => setIsDarkMode(e.target.checked)}
              color="primary"
            />
          }
          label="Dark Mode"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onApply(primaryColor, secondaryColor, isDarkMode ? "dark" : "light")}>
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}