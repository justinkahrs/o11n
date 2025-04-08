import { useState, useEffect, useRef } from "react";
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
import { Save } from "@mui/icons-material";
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
  // Use a ref to capture the original theme values only once when the modal opens
  const initialThemeRef = useRef<{
    primary: string;
    secondary: string;
    mode: "light" | "dark";
  } | null>(null);
  // State for preview
  const [primaryColor, setPrimaryColor] = useState(theme.palette.primary.main);
  const [secondaryColor, setSecondaryColor] = useState(
    theme.palette.secondary.main
  );
  const [isDarkMode, setIsDarkMode] = useState(theme.palette.mode === "dark");
  // When the modal opens, capture the current theme values if not already captured
  useEffect(() => {
    if (open) {
      if (!initialThemeRef.current) {
        initialThemeRef.current = {
          primary: theme.palette.primary.main,
          secondary: theme.palette.secondary.main,
          mode: theme.palette.mode,
        };
      }
      // Update preview state with current theme values
      setPrimaryColor(theme.palette.primary.main);
      setSecondaryColor(theme.palette.secondary.main);
      setIsDarkMode(theme.palette.mode === "dark");
    } else {
      // Reset the ref when modal closes so a fresh capture occurs next time
      initialThemeRef.current = null;
    }
  }, [open, theme]);
  // Instant preview: apply theme changes as the user modifies them
  useEffect(() => {
    onApply(primaryColor, secondaryColor, isDarkMode ? "dark" : "light");
  }, [primaryColor, secondaryColor, isDarkMode, onApply]);
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
        <Button
          variant="outlined"
          onClick={() => {
            if (initialThemeRef.current) {
              const { primary, secondary, mode } = initialThemeRef.current;
              // Revert the preview state to the original values
              setPrimaryColor(primary);
              setSecondaryColor(secondary);
              setIsDarkMode(mode === "dark");
              // Reapply the original theme
              onApply(primary, secondary, mode);
            }
            onClose();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={() => {
            onApply(
              primaryColor,
              secondaryColor,
              isDarkMode ? "dark" : "light"
            );
            onClose();
          }}
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}
