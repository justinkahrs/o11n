import { useState, useEffect } from "react";
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
import {
  check,
  type DownloadEvent,
  type Update,
} from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
export default function AutoUpdateModal() {
  const [open, setOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<Update | null>(null);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateError, setUpdateError] = useState<string | undefined>(undefined);
  useEffect(() => {
    (async () => {
      try {
        const update = await check();
        if (update) {
          setUpdateInfo(update);
          setOpen(true);
        }
      } catch (e) {
        console.error("Update check failed:", e);
        setUpdateError(String(e));
        setOpen(true);
      }
    })();
  }, []);
  const handleDownload = async () => {
    if (!updateInfo) return;
    setDownloadStarted(true);
    let downloaded = 0;
    let contentLength: number | undefined;
    try {
      await updateInfo.download((event: DownloadEvent) => {
        console.log({ event });
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (contentLength) {
              setUpdateProgress((downloaded / contentLength) * 100);
            }
            break;
          case "Finished":
            setUpdateProgress(100);
            break;
          default:
            setUpdateError("Something went way wrong");
            break;
        }
      });
      setUpdateProgress(100);
    } catch (e) {
      console.error("Update download failed:", e);
      setUpdateError(String(e));
    }
  };
  const handleInstallNow = async () => {
    if (!updateInfo) return;
    try {
      await updateInfo.install();
      await relaunch();
    } catch (e) {
      console.error("Update install failed:", e);
      setUpdateError(String(e));
    }
  };
  const handleInstallLater = async () => {
    if (!updateInfo) return;
    try {
      await updateInfo.install();
      await updateInfo.close();
      setOpen(false);
      setUpdateInfo(null);
      setDownloadStarted(false);
      setUpdateProgress(0);
      setUpdateError(undefined);
    } catch (e) {
      console.error("Update install failed:", e);
      setUpdateError(String(e));
    }
  };
  const handleCancel = async () => {
    if (updateInfo) {
      try {
        await updateInfo.close();
      } catch {}
    }
    setOpen(false);
    setUpdateInfo(null);
    setDownloadStarted(false);
    setUpdateProgress(0);
    setUpdateError(undefined);
  };
  const theme = useTheme();
  const isDownloading = downloadStarted && updateProgress < 100 && !updateError;
  const isDownloaded = downloadStarted && updateProgress >= 100 && !updateError;
  return (
    <Dialog onClose={handleCancel} open={open} maxWidth="sm" fullWidth>
      <DialogTitle>
        {updateError
          ? "Update Error"
          : !downloadStarted
          ? "Update Available"
          : isDownloading
          ? "Downloading Update"
          : "Install Update"}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {updateError ? (
            <Typography
              variant="body1"
              color="error"
              sx={{ userSelect: "text !important" }}
            >
              {updateError}
            </Typography>
          ) : !downloadStarted ? (
            <Typography variant="body1">
              Do you want to download the new update?
            </Typography>
          ) : isDownloading ? (
            <>
              {updateProgress > 0 ? (
                <Typography variant="body1">
                  {`Downloading update: ${Math.floor(updateProgress)}%`}
                </Typography>
              ) : (
                <Typography variant="body1">Downloading update...</Typography>
              )}
              <LinearProgress
                variant={updateProgress > 0 ? "determinate" : "indeterminate"}
                value={updateProgress > 0 ? updateProgress : undefined}
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
        {!downloadStarted && !updateError && (
          <>
            <Button variant="contained" onClick={handleDownload}>
              Download
            </Button>
            <Button variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
          </>
        )}
        {isDownloading && !updateError && (
          <Button variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
        )}
        {isDownloaded && !updateError && (
          <>
            <Button variant="contained" onClick={handleInstallNow}>
              Restart and install now
            </Button>
            <Button variant="contained" onClick={handleInstallLater}>
              Install on next load
            </Button>
            <Button variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
          </>
        )}
        {updateError && (
          <Button variant="outlined" onClick={handleCancel}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
