import type React from "react";
import { TextField, IconButton, InputAdornment } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
interface SearchFilesProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}
const SearchFiles: React.FC<SearchFilesProps> = ({
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <TextField
      label="Search Files"
      variant="outlined"
      size="small"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      fullWidth
      sx={{ mt: 2 }}
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
