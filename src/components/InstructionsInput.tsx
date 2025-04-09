import { Box, TextField, Chip, Stack } from "@mui/material";
interface InstructionsInputProps {
  onChange: (value: string) => void;
  mode: string;
  value: string;
}
export function InstructionsInput({ mode, onChange, value }: InstructionsInputProps) {
  const userPrompts: string[] = [];
  const label = mode === "talk" ? "Chat about your files" : "Describe how the files should change";
  return (
    <Box sx={{ px: 2, pt: 2 }}>
      <TextField
        variant="outlined"
        fullWidth
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        multiline
        minRows={4}
        maxRows={8}
        inputProps={{ style: { resize: "none" } }}
        InputLabelProps={{ shrink: true }}
      />
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        {userPrompts.map((prompt: string) => (
          <Chip
            key={prompt}
            label={prompt}
            onClick={() => onChange(prompt)}
          />
        ))}
      </Stack>
    </Box>
  );
}