import { useState, useEffect } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  CircularProgress,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Language as NextIcon,
  DesktopWindows as TauriIcon,
  PhoneIphone as ExpoIcon,
  FolderOpen,
} from "@mui/icons-material";
import RetroButton from "./RetroButton";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

type ProjectType = "nextjs" | "tauri" | "expo";

interface ProjectTemplate {
  type: ProjectType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const templates: ProjectTemplate[] = [
  {
    type: "nextjs",
    label: "Next.js",
    description: "Full-stack React framework with SSR, routing, and API routes",
    icon: <NextIcon />,
  },
  {
    type: "tauri",
    label: "Tauri",
    description:
      "Lightweight desktop apps with a web frontend and Rust backend",
    icon: <TauriIcon />,
  },
  {
    type: "expo",
    label: "Expo",
    description:
      "React Native framework for building cross-platform mobile apps",
    icon: <ExpoIcon />,
  },
];

function getScaffoldCommand(type: ProjectType, name: string) {
  switch (type) {
    case "nextjs":
      return {
        command: "npx",
        args: ["create-next-app@latest", name, "--yes"],
      };
    case "tauri":
      return {
        command: "npm",
        args: ["create", "tauri-app@latest", name, "--", "--yes"],
      };
    case "expo":
      return { command: "npx", args: ["create-expo-app@latest", name] };
  }
}

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  onProjectCreated: (projectPath: string) => void;
}

export default function NewProjectModal({
  open: isOpen,
  onClose,
  onProjectCreated,
}: NewProjectModalProps) {
  const theme = useTheme();
  const [directory, setDirectory] = useState("");
  const [projectName, setProjectName] = useState("");
  const [selectedType, setSelectedType] = useState<ProjectType | null>(null);
  const [step, setStep] = useState<"configure" | "creating" | "error">(
    "configure",
  );
  const [errorMessage, setErrorMessage] = useState("");

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setDirectory("");
      setProjectName("");
      setSelectedType(null);
      setStep("configure");
      setErrorMessage("");
    }
  }, [isOpen]);

  const handlePickDirectory = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (selected && typeof selected === "string") {
      setDirectory(selected);
    }
  };

  const handleCreate = async () => {
    if (!directory || !projectName.trim() || !selectedType) return;

    setStep("creating");
    const { command, args } = getScaffoldCommand(
      selectedType,
      projectName.trim(),
    );

    try {
      await invoke("run_scaffold_command", {
        command,
        args,
        cwd: directory,
      });

      const fullPath = `${directory}/${projectName.trim()}`;
      onProjectCreated(fullPath);
      onClose();
    } catch (err: any) {
      setStep("error");
      setErrorMessage(
        typeof err === "string" ? err : err?.message || "Unknown error",
      );
    }
  };

  const isValid = directory && projectName.trim() && selectedType;

  return (
    <Dialog
      open={isOpen}
      onClose={step === "creating" ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>New Project</DialogTitle>
      <DialogContent>
        {step === "configure" && (
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Directory picker */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 0.5, display: "block" }}
              >
                Project Location
              </Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <TextField
                  fullWidth
                  size="small"
                  value={directory}
                  placeholder="Select a directory…"
                  InputProps={{ readOnly: true }}
                  onClick={handlePickDirectory}
                  sx={{ cursor: "pointer" }}
                />
                <RetroButton
                  onClick={handlePickDirectory}
                  variant="outlined"
                  sx={{ minWidth: 44, px: 1, height: 40 }}
                >
                  <FolderOpen fontSize="small" />
                </RetroButton>
              </Box>
            </Box>

            {/* Project name */}
            <TextField
              autoFocus
              fullWidth
              label="Project Name"
              variant="outlined"
              size="small"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="my-awesome-app"
              onKeyDown={(e) => {
                if (e.key === "Enter" && isValid) handleCreate();
              }}
            />

            {/* Project type selection */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1, display: "block" }}
              >
                Project Type
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {templates.map((tpl) => {
                  const isSelected = selectedType === tpl.type;
                  return (
                    <Box
                      key={tpl.type}
                      onClick={() => setSelectedType(tpl.type)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        cursor: "pointer",
                        border: "2px solid",
                        borderColor: isSelected
                          ? theme.palette.primary.main
                          : theme.palette.divider,
                        backgroundColor: isSelected
                          ? alpha(theme.palette.primary.main, 0.08)
                          : "transparent",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: theme.palette.primary.main,
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.04,
                          ),
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isSelected
                            ? theme.palette.primary.main
                            : theme.palette.text.secondary,
                        }}
                      >
                        {tpl.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={isSelected ? "primary" : "text.primary"}
                        >
                          {tpl.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tpl.description}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        )}

        {step === "creating" && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              py: 4,
            }}
          >
            <CircularProgress size={48} />
            <Typography variant="body1" color="text.secondary">
              Creating{" "}
              <strong>
                {templates.find((t) => t.type === selectedType)?.label}
              </strong>{" "}
              project…
            </Typography>
            <Typography variant="caption" color="text.secondary">
              This may take a minute while dependencies install.
            </Typography>
          </Box>
        )}

        {step === "error" && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="error" sx={{ mb: 1 }}>
              Failed to create project:
            </Typography>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.error.main, 0.08),
                fontFamily: "monospace",
                fontSize: "0.8rem",
                whiteSpace: "pre-wrap",
                maxHeight: 200,
                overflowY: "auto",
              }}
            >
              {errorMessage}
            </Box>
          </Box>
        )}
      </DialogContent>

      {step !== "creating" && (
        <DialogActions sx={{ p: 2 }}>
          <RetroButton onClick={onClose} variant="outlined">
            {step === "error" ? "Close" : "Cancel"}
          </RetroButton>
          {step === "configure" && (
            <RetroButton
              onClick={handleCreate}
              disabled={!isValid}
              variant="contained"
            >
              Create
            </RetroButton>
          )}
          {step === "error" && (
            <RetroButton
              onClick={() => setStep("configure")}
              variant="contained"
            >
              Try Again
            </RetroButton>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}
