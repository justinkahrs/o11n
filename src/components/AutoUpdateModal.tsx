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
  onRelaunch: () => void;
};
export default function AutoUpdateModal({
  open,
  progress,
  onRelaunch,
}: AutoUpdateModalProps) {
  const theme = useTheme();
  const isFinished = progress >= 100;
  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>Updating Application</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
        </Box>
      </DialogContent>
      <DialogActions>
        {isFinished && (
          <Button variant="contained" onClick={onRelaunch}>
            Relaunch
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
