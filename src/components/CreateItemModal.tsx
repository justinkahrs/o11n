import { useState, useEffect } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import RetroButton from "./RetroButton";

interface CreateItemModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  initialDirectory: string;
  type: "file" | "folder";
}

export default function CreateItemModal({
  open,
  onClose,
  onCreate,
  initialDirectory,
  type,
}: CreateItemModalProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
    }
  }, [open]);

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim());
      setName("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>New {type === "file" ? "File" : "Folder"}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label={`${type === "file" ? "File" : "Folder"} name`}
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreate();
              }
            }}
            placeholder={type === "file" ? "e.g. index.tsx" : "e.g. components"}
          />
          <Box sx={{ mt: 1, typography: "caption", color: "text.secondary" }}>
            Create in: {initialDirectory}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <RetroButton onClick={onClose} variant="outlined">
          Cancel
        </RetroButton>
        <RetroButton
          onClick={handleCreate}
          disabled={!name.trim()}
          variant="contained"
        >
          Create
        </RetroButton>
      </DialogActions>
    </Dialog>
  );
}
