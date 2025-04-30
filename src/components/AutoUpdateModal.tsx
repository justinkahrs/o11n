import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  Box,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
type AutoUpdateModalProps = {
  open: boolean;
  progress: number;
  error?: string;
  onRelaunch: () => void;
  onClose: () => void;
};
export default function AutoUpdateModal({
  open,
  progress,
  error,
  onRelaunch,
  onClose,
}: AutoUpdateModalProps) {
  const theme = useTheme();
  const isFinished = progress >= 100;
  return (
    <Dialog onClose={onClose} open={open} maxWidth="sm" fullWidth>
      <DialogTitle>Updating Application</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {error ? (
            <Typography
              variant="body1"
              color="error"
              sx={{ userSelect: "text !important" }}
            >
              {error}
            </Typography>
          ) : (
            <>
              <Typography variant="body1">
                {isFinished
                  ? "Download complete. Ready to relaunch."
                  : `Downloading update: ${Math.floor(progress)}%`}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: theme.palette.divider,
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: theme.palette.secondary.main,
                  },
                }}
              />
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {isFinished && !error && (
          <Button variant="contained" onClick={onRelaunch}>
            Relaunch
          </Button>
        )}
        {error && (
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
