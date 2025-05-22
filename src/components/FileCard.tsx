import { Grid, Typography, IconButton, Tooltip } from "@mui/material";
import { useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFile from "@mui/icons-material/InsertDriveFile";
import { formatFileSize } from "../utils/formatFileSize";
import { useAppContext } from "../context/AppContext";
import type { FileNode } from "../types";
import { useUserContext } from "../context/UserContext";
interface FileCardProps {
  file: FileNode;
  percentage: string;
  onRemoveFile: (fileId: string) => void;
}
export function FileCard({ file, percentage, onRemoveFile }: FileCardProps) {
  const { handleFilePreviewClick } = useAppContext();
  const { countTokens } = useUserContext();
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteHovered, setIsDeleteHovered] = useState(false);
  return (
    <Grid
      container
      item
      xs={12}
      sm={5}
      md={3}
      sx={{
        position: "relative",
        borderRadius: "4px",
        border: "1px solid lightgrey",
        cursor: "pointer",
        padding: 2,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => handleFilePreviewClick(e, file)}
    >
      <Tooltip
        arrow
        disableInteractive
        enterDelay={500}
        placement="right"
        title="Remove file"
      >
        <IconButton
          aria-label="delete"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFile(file.id);
          }}
          onMouseEnter={(e) => {
            e.stopPropagation();
            setIsDeleteHovered(true);
          }}
          onMouseLeave={() => setIsDeleteHovered(false)}
          sx={{ position: "absolute", top: 8, right: 8 }}
        >
          <DeleteIcon
            sx={{
              fontSize: "18px",
            }}
          />
        </IconButton>
      </Tooltip>
      <Grid container direction="column">
        <Grid item>
          <Typography variant="subtitle2">
            <Tooltip
              arrow
              disableInteractive
              enterDelay={500}
              title="Preview"
              placement="right"
            >
              <InsertDriveFile
                className="file-icon"
                color="secondary"
                sx={{
                  color: isDeleteHovered
                    ? "secondary.main"
                    : isHovered
                    ? "primary.main"
                    : "secondary.main",
                }}
              />
            </Tooltip>
          </Typography>
        </Grid>
        <Grid container>
          <Grid item sx={{ minWidth: 0 }} zeroMinWidth>
            <Typography
              variant="subtitle2"
              sx={{
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {file.name}
            </Typography>
          </Grid>
          <Grid
            item
            sx={{
              overflowX: "hidden",
              textOverflow: "ellipsis",
              wordWrap: "nowrap",
            }}
          >
            <Typography variant="caption">
              {formatFileSize(file.size)} ({percentage}%)
            </Typography>
          </Grid>
          {countTokens && (
            <Grid
              item
              sx={{
                overflowX: "hidden",
                textOverflow: "ellipsis",
                wordWrap: "nowrap",
              }}
            >
              <Typography variant="caption">{file.tokenSize} tokens</Typography>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
}
