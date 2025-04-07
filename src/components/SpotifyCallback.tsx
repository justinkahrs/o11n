import { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
// import { invoke } from "@tauri-apps/api/core";
export default function SpotifyCallback() {
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const errorParam = params.get("error");
    if (errorParam) {
      setError(errorParam);
    } else if (code) {
      setAuthCode(code);
      console.log("Spotify auth code:", code);
      // Optionally, exchange the auth code for an access token here using invoke
      // e.g., invoke("exchange_spotify_code", { code });
    }
  }, []);
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Spotify Authentication Callback
      </Typography>
      {error ? (
        <Typography color="error">
          Error during authentication: {error}
        </Typography>
      ) : authCode ? (
        <Typography>Successfully received auth code: {authCode}</Typography>
      ) : (
        <Typography>No authentication code received.</Typography>
      )}
      <Button variant="contained" href="/">
        Return to App
      </Button>
    </Box>
  );
}
