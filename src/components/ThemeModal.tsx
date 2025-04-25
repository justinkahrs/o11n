import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  FormControlLabel,
  useTheme,
  Menu,
  Box,
} from "@mui/material";
import { theme as defaultTheme } from "../theme";
import { Close, Replay, Save, Shuffle } from "@mui/icons-material";
import tinycolor from "tinycolor2";
import { useUserContext } from "../context/UserContext";
import { HexColorPicker } from "react-colorful";
import LogoSVG from "./LogoSVG";
import RetroButton from "./RetroButton";

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
  const { showLogo, setShowLogo } = useUserContext();
  // State for popover anchors for color pickers
  const [primaryAnchorEl, setPrimaryAnchorEl] = useState<HTMLElement | null>(
    null
  );
  const [secondaryAnchorEl, setSecondaryAnchorEl] =
    useState<HTMLElement | null>(null);
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
  }, [open]);
  // Instant preview: apply theme changes as the user modifies them
  useEffect(() => {
    onApply(primaryColor, secondaryColor, isDarkMode ? "dark" : "light");
  }, [primaryColor, secondaryColor, isDarkMode, onApply]);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Configure Theme</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderRight: `1px solid ${theme.palette.divider}`,
              paddingRight: 2,
            }}
          >
            <LogoSVG />
          </Box>
          <Box sx={{ flex: 1, paddingLeft: 2 }}>
            <Box
              style={{
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <Box>Primary Color</Box>
              <Box
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: primaryColor,
                  cursor: "pointer",
                }}
                onClick={(event) => setPrimaryAnchorEl(event.currentTarget)}
                onKeyDown={(event) => setPrimaryAnchorEl(event.currentTarget)}
              />
              <Menu
                open={Boolean(primaryAnchorEl)}
                anchorEl={primaryAnchorEl}
                onClose={() => setPrimaryAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                slotProps={{
                  paper: {
                    style: {
                      padding: "0px 8px",
                    },
                  },
                }}
              >
                <HexColorPicker
                  color={primaryColor}
                  onChange={setPrimaryColor}
                />
              </Menu>
            </Box>
            <Box
              style={{
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <Box>Secondary Color</Box>
              <Box
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  backgroundColor: secondaryColor,
                  cursor: "pointer",
                }}
                onClick={(event) => setSecondaryAnchorEl(event.currentTarget)}
                onKeyDown={(event) => setSecondaryAnchorEl(event.currentTarget)}
              />

              <Menu
                open={Boolean(secondaryAnchorEl)}
                anchorEl={secondaryAnchorEl}
                onClose={() => setSecondaryAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                slotProps={{
                  paper: {
                    style: {
                      padding: "0px 8px",
                    },
                  },
                }}
              >
                <HexColorPicker
                  color={secondaryColor}
                  onChange={setSecondaryColor}
                />
              </Menu>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={isDarkMode}
                  onChange={(e) => setIsDarkMode(e.target.checked)}
                  color="primary"
                />
              }
              label="Dark Mode"
              sx={{ width: "100%" }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  color="primary"
                />
              }
              label="Show Logo"
              sx={{ width: "100%" }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ display: "flex", justifyContent: "space-between" }}>
        <RetroButton
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
          startIcon={<Close />}
          sx={{ height: 40, mb: 1, ml: 1 }}
          variant="outlined"
        >
          Cancel
        </RetroButton>
        <Button
          startIcon={<Replay />}
          variant="text"
          onClick={() => {
            setPrimaryColor(defaultTheme.palette.primary.main);
            setSecondaryColor(defaultTheme.palette.secondary.main);
            setIsDarkMode(defaultTheme.palette.mode === "dark");
            onApply(
              defaultTheme.palette.primary.main,
              defaultTheme.palette.secondary.main,
              defaultTheme.palette.mode
            );
          }}
        >
          Reset
        </Button>
        <Button
          startIcon={<Shuffle />}
          variant="text"
          onClick={() => {
            const newPrimary = tinycolor.random().toHexString();
            const newSecondary = tinycolor(newPrimary)
              .complement()
              .toHexString();
            const newIsDarkMode = Math.random() < 0.5;
            setPrimaryColor(newPrimary);
            setSecondaryColor(newSecondary);
            setIsDarkMode(newIsDarkMode);
            onApply(newPrimary, newSecondary, newIsDarkMode ? "dark" : "light");
          }}
        >
          Randomize
        </Button>
        <RetroButton
          onClick={() => {
            onApply(
              primaryColor,
              secondaryColor,
              isDarkMode ? "dark" : "light"
            );
            onClose();
          }}
          startIcon={<Save />}
          sx={{ height: 40, mb: 1, mr: 1 }}
        >
          Apply
        </RetroButton>
      </DialogActions>
    </Dialog>
  );
}
