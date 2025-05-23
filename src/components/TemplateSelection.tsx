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
  Tooltip,
} from "@mui/material";
import {
  Create,
  FolderOpen,
  VisibilityOff,
  Close,
  InfoOutlined,
} from "@mui/icons-material";
import {
  writeTextFile,
  BaseDirectory,
  readTextFile,
} from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";
import { homeDir } from "@tauri-apps/api/path";
import { useAppContext } from "../context/AppContext";
import RetroButton from "./RetroButton";

interface CustomTemplate {
  id: string;
  name: string;
  path: string;
  active: boolean;
}

const TemplateSelection = () => {
  const { mode, customTemplates, setCustomTemplates, setProjects } =
    useAppContext();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateInstructions, setTemplateInstructions] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [templateContents, setTemplateContents] = useState<
    Record<string, string>
  >({});

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
      const dir = await homeDir();
      const selectedPath = await open({
        multiple: false,
        defaultPath: dir,
        filters: [
          {
            name: "Text Files",
            extensions: ["txt", "xml", "md"],
          },
        ],
      });
      if (selectedPath && typeof selectedPath === "string") {
        const fileName = selectedPath.split("/").pop() || "Template";
        const newTemplate = {
          id: Date.now().toString(),
          name: fileName.replace(/\.[^/.]+$/, ""),
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
    try {
      const dir = await homeDir();
      const selectedDir = await open({
        directory: true,
        multiple: false,
        defaultPath: dir,
      });
      if (selectedDir && typeof selectedDir === "string") {
        const filePath = `${selectedDir}/${templateName}.txt`;
        await writeTextFile(filePath, templateInstructions);
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
        setProjects((prev) =>
          prev.map((proj) =>
            proj.path === selectedDir || proj.path.startsWith(`${selectedDir}/`)
              ? { ...proj, children: [], loadedChildren: false }
              : proj
          )
        );
      }
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
          mb: 1,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
          <Tooltip
            arrow
            disableInteractive
            enterDelay={500}
            enterNextDelay={500}
            title="Create toggle"
          >
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleCreateClick();
              }}
            >
              <Create fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip
            arrow
            disableInteractive
            enterDelay={500}
            enterNextDelay={500}
            title="Open toggle"
          >
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenClick();
              }}
            >
              <FolderOpen fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip
            disableInteractive
            enterDelay={500}
            enterNextDelay={500}
            title="Handy for switching context easily"
            arrow
          >
            <IconButton size="small">
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        <Stack direction="row" spacing={1}>
          {customTemplates.map((template) => (
            <Box
              key={template.id}
              sx={{ position: "relative", display: "inline-block" }}
              onMouseEnter={() => {
                setHoveredId(template.id);
                if (!templateContents[template.id]) {
                  readTextFile(template.path, { baseDir: BaseDirectory.Home })
                    .then((content) =>
                      setTemplateContents((prev) => ({
                        ...prev,
                        [template.id]: content,
                      }))
                    )
                    .catch((error) =>
                      console.error("Error reading template file:", error)
                    );
                }
              }}
              onMouseLeave={() => setHoveredId(null)}
            >
              <Tooltip
                arrow
                disableInteractive
                enterDelay={500}
                enterNextDelay={500}
                title={templateContents[template.id] ?? template.path}
              >
                <Chip
                  avatar={
                    hoveredId === template.id ? (
                      <>
                        <Tooltip
                          arrow
                          disableInteractive
                          enterDelay={500}
                          enterNextDelay={500}
                          title="Toggle"
                          placement="top"
                        >
                          <IconButton
                            size="small"
                            onClick={() => onToggleTemplate(template.id)}
                          >
                            <VisibilityOff fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          arrow
                          disableInteractive
                          enterDelay={500}
                          enterNextDelay={500}
                          title="Remove toggle"
                          placement="top"
                        >
                          <IconButton
                            size="small"
                            onClick={() => onRemoveTemplate(template.id)}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : undefined
                  }
                  label={template.name.replace(/\.[^/.]+$/, "")}
                  color={template.active ? "secondary" : "default"}
                />
              </Tooltip>
            </Box>
          ))}
        </Stack>
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
        >
          <DialogTitle>Create Toggle Prompt</DialogTitle>
          <DialogContent>
            <TextField
              variant="outlined"
              autoFocus
              margin="dense"
              label="Name/Role"
              fullWidth
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              margin="dense"
              variant="outlined"
              label="Special Instructions"
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
              disabled={!templateName || !templateInstructions}
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
