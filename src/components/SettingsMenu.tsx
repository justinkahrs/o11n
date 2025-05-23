import { useState, useRef } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Palette, Settings } from "@mui/icons-material";
import ThemeModal from "./ThemeModal";
import { useUserContext } from "../context/UserContext";
import useShortcut from "../utils/useShortcut";

export default function SettingsMenu() {
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  useShortcut(
    ",",
    () => {
      if (anchorEl) {
        setAnchorEl(null);
      } else if (settingsButtonRef.current) {
        setAnchorEl(settingsButtonRef.current);
      }
    },
    { metaKey: true, ctrlKey: true }
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const {
    countTokens,
    formatOutput,
    onThemeChange,
    setCountTokens,
    setFormatOutput,
    setShowDotfiles,
    showDotfiles,
    useIgnoreFiles,
    setUseIgnoreFiles,
    showShortcuts,
    setShowShortcuts,
    includeFileTree,
    setIncludeFileTree,
  } = useUserContext();

  const handleSettingsOpen = (event: React.SyntheticEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton ref={settingsButtonRef} onClick={handleSettingsOpen}>
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
                checked={formatOutput}
                onChange={(e) => setFormatOutput(e.target.checked)}
              />
            }
            label="Full orchestration"
          />
        </MenuItem>
        <MenuItem>
          <FormControlLabel
            control={
              <Checkbox
                checked={includeFileTree}
                onChange={(e) => setIncludeFileTree(e.target.checked)}
              />
            }
            label="Include file tree"
          />
        </MenuItem>
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
        <MenuItem>
          <FormControlLabel
            control={
              <Checkbox
                checked={useIgnoreFiles}
                onChange={(e) => setUseIgnoreFiles(e.target.checked)}
              />
            }
            label="Respect .gitignore"
          />
        </MenuItem>
        <MenuItem>
          <FormControlLabel
            control={
              <Checkbox
                checked={countTokens}
                onChange={(e) => setCountTokens(e.target.checked)}
              />
            }
            label="Show token counts"
          />
        </MenuItem>
        <MenuItem>
          <FormControlLabel
            control={
              <Checkbox
                checked={showShortcuts}
                onChange={(e) => setShowShortcuts(e.target.checked)}
              />
            }
            label="Show shortcuts"
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setThemeModalOpen(true);
            handleSettingsClose();
          }}
        >
          <Palette sx={{ mr: 1 }} />
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
