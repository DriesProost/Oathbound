import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";
import "./materials.css";
import "./mobile.css";
import { startPwa } from "./pwa";
startPwa();
import { startMobileViewport } from "./mobile";
startMobileViewport();
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
