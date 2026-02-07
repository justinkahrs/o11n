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
  Tabs,
  Tab,
  Box,
} from "@mui/material";
import { Visibility, VisibilityOff, Save, Close } from "@mui/icons-material";
import { useUserContext } from "../context/UserContext";
import RetroButton from "./RetroButton";

type ApiKeysModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ApiKeysModal({ open, onClose }: ApiKeysModalProps) {
  const {
    zaiApiKey,
    setZaiApiKey,
    openAiApiKey,
    setOpenAiApiKey,
    activeProvider,
    setActiveProvider,
    apiMode,
    setApiMode,
  } = useUserContext();
  const [inputKey, setInputKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  // Sync local state with context when modal opens or tab changes
  useEffect(() => {
    if (open) {
      if (activeProvider === "openai") {
        setCurrentTab(1);
        setInputKey(openAiApiKey || "");
      } else {
        setCurrentTab(0);
        setInputKey(zaiApiKey || "");
      }
      setShowKey(false);
    }
  }, [open, activeProvider, zaiApiKey, openAiApiKey]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    // Save current input to the *previous* tab's key before switching?
    // Or just switch context. Let's keep it simple: switching tabs switches the active provider context immediately?
    // The user requirement says "based on the active API (tab) we will pick that endpoint".
    // So changing tab SHOULD change activeProvider.
    // ALSO, we should probably save the inputKey to the *previous* provider if modified?
    // For simplicity, let's just switch the input value to the new provider's stored key.
    setCurrentTab(newValue);
    const newProvider = newValue === 0 ? "zai" : "openai";
    setActiveProvider(newProvider);
    setInputKey(newValue === 0 ? zaiApiKey || "" : openAiApiKey || "");
    setShowKey(false);
  };

  const handleSave = () => {
    if (currentTab === 0) {
      setZaiApiKey(inputKey);
    } else {
      setOpenAiApiKey(inputKey);
    }
    // We also essentially confirmed the active provider is the current tab
    setActiveProvider(currentTab === 0 ? "zai" : "openai");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>API Keys</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="api provider tabs"
          >
            <Tab label="Z.AI" />
            <Tab label="OpenAI" />
          </Tabs>
        </Box>
        <TextField
          autoFocus
          margin="dense"
          id="apiKey"
          label={currentTab === 0 ? "Z.AI Key" : "OpenAI Key"}
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
