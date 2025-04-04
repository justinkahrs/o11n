import { useState } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Settings } from "@mui/icons-material";
import ThemeModal from "./ThemeModal";

type SettingsMenuProps = {
  showDotfiles: boolean;
  setShowDotfiles: (value: boolean) => void;
  onThemeChange: (
    primary: string,
    secondary: string,
    mode: "light" | "dark"
  ) => void;
};

export default function SettingsMenu({
  onThemeChange,
  showDotfiles,
  setShowDotfiles,
}: SettingsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  const handleSettingsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={handleSettingsOpen}>
        <Settings />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleSettingsClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <MenuItem>
          <FormControlLabel
            control={
              <Checkbox
                checked={showDotfiles}
                onChange={(e) => setShowDotfiles(e.target.checked)}
              />
            }
            label="Show .dotfiles"
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setThemeModalOpen(true);
            handleSettingsClose();
          }}
        >
          Configure theme
        </MenuItem>
      </Menu>
      <ThemeModal
        open={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
        onApply={(primary, secondary, mode) => {
          onThemeChange(primary, secondary, mode);
          // setThemeModalOpen(false);
        }}
      />
    </>
  );
}
