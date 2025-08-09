import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import HomeProvider from "./Context/HomeProvider.jsx";
import { SpeedInsights } from "@vercel/speed-insights/react";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HomeProvider>
      <App />
      <SpeedInsights />
    </HomeProvider>
  </StrictMode>
);
