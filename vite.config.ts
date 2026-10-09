import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { pwaShell } from "./build/pwa";
export default defineConfig({ plugins: [react(), pwaShell()] });
