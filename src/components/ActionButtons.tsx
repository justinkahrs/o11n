import { Stack } from "@mui/material";
import Copy from "./Copy";
import { useAppContext } from "../context/AppContext";
import Commit from "./Commit";

const ActionButtons = () => {
  const { mode } = useAppContext();

  return (
    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
      {mode === "do" ? <Commit /> : <Copy />}
    </Stack>
  );
};
export default ActionButtons;
