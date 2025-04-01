import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  useTheme,
} from "@mui/material";

type ThemeModalProps = {
  open: boolean;
  onClose: () => void;
  onApply: (primary: string, secondary: string) => void;
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onApply(primaryColor, secondaryColor)}>
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}
