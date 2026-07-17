import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";

// Disable Create-React-App's red runtime error overlay. Handled promise
// rejections from axios interceptors still surface in the console (dev only)
// but never take over the screen. In production this module is a no-op.
if (process.env.NODE_ENV !== "production") {
  try {
    // eslint-disable-next-line global-require
    const overlay = require("react-error-overlay");
    if (overlay && typeof overlay.stopReportingRuntimeErrors === "function") {
      overlay.stopReportingRuntimeErrors();
    }
  } catch { /* module not installed in this build — safe to skip */ }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
