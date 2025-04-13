import { Stack } from "@mui/material";
import Copy from "./Copy";
import { useAppContext } from "../context/AppContext";
import Commit from "./Commit";

const ActionButtons = () => {
  const { mode } = useAppContext();

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ mt: 2 }}
      justifyContent={mode === "do" ? "flex-end" : "space-between"}
    >
      {mode === "do" ? <Commit /> : <Copy />}
    </Stack>
  );
};
export default ActionButtons;
