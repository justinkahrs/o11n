import { Box, Typography, List, ListItemText, ListItem } from "@mui/material";

interface FileNode {
  id: string;
  name: string;
  path: string;
  size: number;
}

interface SelectedFilesProps {
  files: FileNode[];
}

export function SelectedFiles({ files }: SelectedFilesProps) {
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">Selected Files</Typography>
      <List>
        {files.map(file => {
          const pct = totalSize ? ((file.size / totalSize) * 100).toFixed(1) : "0";
          return (
            <ListItem key={file.id}>
              <ListItemText
                primary={`${file.path}`}
                secondary={`Size: ${file.size} MB • ${pct}% of total`}
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}