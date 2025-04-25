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
import { useAppContext } from "../context/AppContext";
import RetroButton from "./RetroButton";

interface CustomTemplate {
  id: string;
  name: string;
  path: string;
  active: boolean;
}

const TemplateSelection = () => {
  const { mode, customTemplates, setCustomTemplates } = useAppContext();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateInstructions, setTemplateInstructions] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const onAddTemplate = (template: CustomTemplate) => {
    setCustomTemplates((prev) => [...prev, template]);
  };
  const onRemoveTemplate = (id: string) => {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
  };
  const onToggleTemplate = (id: string) =>
    setCustomTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    );

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
    mode !== "do" && (
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mx: 2,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
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
          {customTemplates.map((template) => (
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
            <RetroButton
              onClick={() => setCreateDialogOpen(false)}
              sx={{ height: 40, mb: 1, mx: 1 }}
              variant="outlined"
            >
              Cancel
            </RetroButton>
            <RetroButton
              onClick={handleCreateSubmit}
              startIcon={<Create />}
              sx={{ height: 40, mb: 1, mr: 2 }}
            >
              Create
            </RetroButton>
          </DialogActions>
        </Dialog>
      </Box>
    )
  );
};

export default TemplateSelection;
