import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { Visibility, VisibilityOff, Save, Close } from "@mui/icons-material";
import { useUserContext } from "../context/UserContext";
import RetroButton from "./RetroButton";

type ApiKeysModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ApiKeysModal({ open, onClose }: ApiKeysModalProps) {
  const { apiKey, setApiKey, apiMode, setApiMode } = useUserContext();
  const [inputKey, setInputKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  // Sync local state with context when modal opens
  useEffect(() => {
    if (open) {
      setInputKey(apiKey || "");
      setShowKey(false);
    }
  }, [open, apiKey]);

  const handleSave = () => {
    setApiKey(inputKey);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>API Keys</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="apiKey"
          label="API Key"
          type={showKey ? "text" : "password"}
          fullWidth
          variant="outlined"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowKey(!showKey)}
                  edge="end"
                >
                  {showKey ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mt: 1 }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={apiMode}
              onChange={(e) => setApiMode(e.target.checked)}
            />
          }
          label="API Mode"
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions
        sx={{ p: 2, display: "flex", justifyContent: "space-between" }}
      >
        <RetroButton
          onClick={onClose}
          startIcon={<Close />}
          variant="outlined"
          sx={{ height: 40 }}
        >
          Cancel
        </RetroButton>
        <RetroButton
          onClick={handleSave}
          startIcon={<Save />}
          sx={{ height: 40 }}
        >
          Save
        </RetroButton>
      </DialogActions>
    </Dialog>
  );
}
