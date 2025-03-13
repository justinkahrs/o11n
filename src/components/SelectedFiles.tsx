import { Box, Typography, List, ListItem, ListItemText, IconButton } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface FileNode {
  id: string;
  name: string;
  path: string;
  size: number;
}

interface SelectedFilesProps {
  files: FileNode[];
  onRemoveFile: (fileId: string) => void;
  onRemoveFolder: (folderPath: string) => void;
}

export function SelectedFiles({ files, onRemoveFile, onRemoveFolder }: SelectedFilesProps) {
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const groupedFiles = files.reduce((acc: { [folder: string]: FileNode[] }, file) => {
    const lastSlash = file.path.lastIndexOf('/');
    const folder = lastSlash !== -1 ? file.path.substring(0, lastSlash) : 'Root';
    if (!acc[folder]) {
      acc[folder] = [];
    }
    acc[folder].push(file);
    return acc;
  }, {} as { [folder: string]: FileNode[] });

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">Selected Files</Typography>
      {Object.keys(groupedFiles).sort().map((folder) => {
        const filesInFolder = groupedFiles[folder];
        const count = filesInFolder.length;
        const folderSize = filesInFolder.reduce((sum, f) => sum + f.size, 0);
        const percentage = totalSize ? ((folderSize / totalSize) * 100).toFixed(1) : "0";
        return (
            <Accordion defaultExpanded key={folder} sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel-${folder}-content`}
              id={`panel-${folder}-header`}
            >
              <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                {folder} - {count} files selected, Size: {folderSize} MB • {percentage}% of total
              </Typography>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFolder(folder);
                }}
                aria-label="delete folder"
              >
                <DeleteIcon />
              </IconButton>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {filesInFolder.map(file => {
                  const pct = totalSize ? ((file.size / totalSize) * 100).toFixed(1) : "0";
                  return (
                    <ListItem key={file.id} secondaryAction={
                      <IconButton edge="end" aria-label="delete" onClick={() => onRemoveFile(file.id)}>
                        <DeleteIcon />
                      </IconButton>
                    }>
                      <ListItemText
                        primary={file.name}
                        secondary={`Size: ${file.size} MB • ${pct}% of total`}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}