import type React from "react";
import { useRef } from "react";
import {
  TextField,
  IconButton,
  InputAdornment,
  Grid,
  Tooltip,
} from "@mui/material";
import useShortcut from "../utils/useShortcut";
import CloseIcon from "@mui/icons-material/Close";
import { platform } from "@tauri-apps/plugin-os";
import { KeyboardCommandKey } from "@mui/icons-material";
import { useUserContext } from "../context/UserContext";
interface SearchFilesProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SearchFiles: React.FC<SearchFilesProps> = ({
  searchQuery,
  setSearchQuery,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { showShortcuts, useIgnoreFiles } = useUserContext();
  const isSearchDisabled = !useIgnoreFiles;
  const labelText = showShortcuts ? (
    platform() === "macos" ? (
      <Grid container spacing={1}>
        <Grid item>Search files</Grid>
        <Grid item>
          (
          <KeyboardCommandKey
            sx={{
              paddingTop: "2px",
              fontSize: "14px",
            }}
          />
          + f )
        </Grid>
      </Grid>
    ) : (
      <>Search files (Ctrl + F)</>
    )
  ) : (
    "Search files"
  );
  useShortcut(
    "f",
    () => {
      if (inputRef.current) {
        inputRef.current.focus();
        if (inputRef.current.value) {
          inputRef.current.select();
        }
      }
    },
    { ctrlKey: true, metaKey: true }
  );
  return (
    <>
      {isSearchDisabled ? (
        <Tooltip title="Search is disabled when .gitignore is disabled. Enable 'Use .gitignore' in settings to search files.">
          <div>
            <TextField
              className="search-files"
              inputRef={inputRef}
              label={labelText}
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              disabled
              sx={{ mt: 2 }}
              inputProps={{ style: { resize: "none" } }}
              InputProps={{
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => setSearchQuery("")}
                    >
                      <CloseIcon />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </div>
        </Tooltip>
      ) : (
        <TextField
          className="search-files"
          inputRef={inputRef}
          label={labelText}
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          sx={{ mt: 2 }}
          inputProps={{ style: { resize: "none" } }}
          InputProps={{
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton
                  color="primary"
                  size="small"
                  onClick={() => setSearchQuery("")}
                >
                  <CloseIcon />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      )}
    </>
  );
};
export default SearchFiles;
