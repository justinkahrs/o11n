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
  downloadStarted: boolean;
  progress: number;
  error?: string;
  onDownload: () => void;
  onInstallNow: () => void;
  onInstallLater: () => void;
  onCancel: () => void;
};
export default function AutoUpdateModal({
  open,
  downloadStarted,
  progress,
  error,
  onDownload,
  onInstallNow,
  onInstallLater,
  onCancel,
}: AutoUpdateModalProps) {
  const theme = useTheme();
  const isDownloading = downloadStarted && progress < 100 && !error;
  const isDownloaded = downloadStarted && progress >= 100 && !error;
  return (
    <Dialog onClose={onCancel} open={open} maxWidth="sm" fullWidth>
      <DialogTitle>
        {error
          ? "Update Error"
          : !downloadStarted
          ? "Update Available"
          : isDownloading
          ? "Downloading Update"
          : "Install Update"}
      </DialogTitle>
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
          ) : !downloadStarted ? (
            <Typography variant="body1">
              Do you want to download the new update?
            </Typography>
          ) : isDownloading ? (
            <>
              {progress > 0 ? (
                <Typography variant="body1">
                  {`Downloading update: ${Math.floor(progress)}%`}
                </Typography>
              ) : (
                <Typography variant="body1">Downloading update...</Typography>
              )}
              <LinearProgress
                variant={progress > 0 ? "determinate" : "indeterminate"}
                value={progress > 0 ? progress : undefined}
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
          ) : isDownloaded ? (
            <Typography variant="body1">
              Download complete. What would you like to do?
            </Typography>
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions>
        {!downloadStarted && !error && (
          <>
            <Button variant="contained" onClick={onDownload}>
              Download
            </Button>
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>
          </>
        )}
        {isDownloading && !error && (
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {isDownloaded && !error && (
          <>
            <Button variant="contained" onClick={onInstallNow}>
              Restart and install now
            </Button>
            <Button variant="contained" onClick={onInstallLater}>
              Install on next load
            </Button>
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>
          </>
        )}
        {error && (
          <Button variant="outlined" onClick={onCancel}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
