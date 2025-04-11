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
import { useUserContext } from "../context/UserContext";

export default function SettingsMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const { showDotfiles, setShowDotfiles, onThemeChange } = useUserContext();

  const handleSettingsOpen = (event: React.SyntheticEvent<HTMLElement>) => {
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
