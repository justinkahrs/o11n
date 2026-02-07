import { Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Copy from "./Copy";
import { useAppContext } from "../context/AppContext";
import Commit from "./Commit";
import { useUserContext } from "../context/UserContext";
import RetroButton from "./RetroButton";

const ActionButtons = () => {
  const { mode, chatMessages, setChatMessages } = useAppContext();
  const { formatOutput, apiMode } = useUserContext();

  const isChatMode = !formatOutput && apiMode;

  const handleClearChat = () => {
    setChatMessages([]);
  };

  return (
    <Stack direction="row" spacing={2} sx={{ mt: 2 }} alignItems="center">
      {mode === "do" ? <Commit /> : <Copy />}

      {isChatMode && chatMessages.length > 0 && (
        <RetroButton
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleClearChat}
        >
          Clear Chat
        </RetroButton>
      )}
    </Stack>
  );
};
export default ActionButtons;
