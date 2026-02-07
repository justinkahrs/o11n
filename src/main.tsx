import React from "react";
import * as Sentry from "@sentry/react";
import ReactDOM from "react-dom/client";
import App from "./App";

Sentry.init({
  dsn: "https://670f41ff6f2403d4838ea67a695f3791@o4509202782683136.ingest.us.sentry.io/4509202784649216",
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<p>welp, someone dun goofed.</p>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);
