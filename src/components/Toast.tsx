import Snackbar from "@mui/material/Snackbar";
import { useTheme } from "@mui/material/styles";
interface ToastProps {
  open: boolean;
  message: string;
  onClose: () => void;
}
const Toast: React.FC<ToastProps> = ({ open, message, onClose }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Snackbar
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      open={open}
      message={message}
      autoHideDuration={1000}
      onClose={onClose}
      ContentProps={{
        sx: {
          background: isDark
            ? theme.palette.common.white
            : theme.palette.common.black,
          color: isDark
            ? theme.palette.common.black
            : theme.palette.common.white,
          maxWidth: "300px",
        },
      }}
    />
  );
};
export default Toast;
