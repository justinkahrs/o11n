import type React from "react";
import { TextField, IconButton, InputAdornment } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAppContext } from "../context/AppContext";
interface SearchFilesProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}
const SearchFiles: React.FC<SearchFilesProps> = ({
  searchQuery,
  setSearchQuery,
}) => {
  const { mode } = useAppContext();
  const doMode = mode === "do";
  return (
    <TextField
      disabled={doMode}
      label="Search Files"
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
  );
};
export default SearchFiles;
