import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Box,
} from "@mui/material";
import RetroButton from "./RetroButton";

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: "file" | "folder";
}

export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  itemName,
  itemType,
}: DeleteConfirmModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        Delete {itemType === "file" ? "File" : "Folder"}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete <strong>{itemName}</strong>?
          {itemType === "folder" && (
            <Box
              component="span"
              sx={{
                display: "block",
                mt: 1,
                color: "error.main",
                fontSize: "0.875rem",
              }}
            >
              Warning: This will delete the folder and all of its contents.
            </Box>
          )}
          This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <RetroButton onClick={onClose} variant="outlined">
          Cancel
        </RetroButton>
        <RetroButton
          onClick={() => {
            onConfirm();
            onClose();
          }}
          color="error"
          variant="contained"
        >
          Delete
        </RetroButton>
      </DialogActions>
    </Dialog>
  );
}
