import type React from "react";
import { useState } from "react";
import {
  Chip,
  Stack,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
} from "@mui/material";
import {
  Add,
  Create,
  FolderOpen,
  VisibilityOff,
  Close,
} from "@mui/icons-material";
import { writeTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";

interface CustomTemplate {
  id: string;
  name: string;
  path: string;
  active: boolean;
}

interface TemplateSelectionProps {
  templates: CustomTemplate[];
  onAddTemplate: (template: CustomTemplate) => void;
  onRemoveTemplate: (id: string) => void;
  onToggleTemplate: (id: string) => void;
}

const TemplateSelection: React.FC<TemplateSelectionProps> = ({
  templates,
  onAddTemplate,
  onRemoveTemplate,
  onToggleTemplate,
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateInstructions, setTemplateInstructions] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleCreateClick = () => {
    setCreateDialogOpen(true);
  };

  const handleOpenClick = async () => {
    try {
      const selectedPath = await open({
        multiple: false,
        filters: [
          {
            name: "Text Files",
            extensions: ["txt", "xml", "md"],
          },
        ],
      });
      if (selectedPath && typeof selectedPath === "string") {
        const newTemplate = {
          id: Date.now().toString(),
          name: selectedPath.split("/").pop() || "Template",
          path: selectedPath,
          active: true,
        };
        onAddTemplate(newTemplate);
      }
    } catch (error) {
      console.error("Error opening file:", error);
    }
  };

  const handleCreateSubmit = async () => {
    if (!templateName) return;
    // Save file in ./.o11n/ folder with the template name as filename and .txt extension
    const filePath = `${templateName}.txt`;
    try {
      await writeTextFile(filePath, templateInstructions, {
        baseDir: BaseDirectory.Home,
      });
      const newTemplate = {
        id: Date.now().toString(),
        name: templateName,
        path: filePath,
        active: true,
      };
      onAddTemplate(newTemplate);
      setTemplateName("");
      setTemplateInstructions("");
      setCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating template file:", error);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        my: 2,
        mx: 2,
      }}
    >
      <Stack direction="row" spacing={1}>
        <Chip
          label="Add saved prompt"
          avatar={
            hoveredId === "add" ? (
              <>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateClick();
                  }}
                >
                  <Create fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenClick();
                  }}
                >
                  <FolderOpen fontSize="small" />
                </IconButton>
              </>
            ) : (
              <Add />
            )
          }
          onMouseEnter={() => setHoveredId("add")}
          onMouseLeave={() => setHoveredId(null)}
        />
      </Stack>
      <Stack direction="row" spacing={1}>
        {templates.map((template) => (
          <Box
            key={template.id}
            sx={{ position: "relative", display: "inline-block" }}
            onMouseEnter={() => setHoveredId(template.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <Chip
              avatar={
                hoveredId === template.id ? (
                  <>
                    <IconButton
                      size="small"
                      onClick={() => onToggleTemplate(template.id)}
                    >
                      <VisibilityOff fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onRemoveTemplate(template.id)}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </>
                ) : undefined
              }
              label={template.name}
              color={template.active ? "secondary" : "default"}
            />
          </Box>
        ))}
      </Stack>
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      >
        <DialogTitle>Create Custom Template</DialogTitle>
        <DialogContent>
          <TextField
            variant="outlined"
            autoFocus
            margin="dense"
            label="Template Name"
            fullWidth
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="dense"
            variant="outlined"
            label="Instructions"
            fullWidth
            multiline
            minRows={3}
            value={templateInstructions}
            onChange={(e) => setTemplateInstructions(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateSubmit}
            startIcon={<Create />}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateSelection;
