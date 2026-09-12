import { defineConfig } from "vite";

// A user site serves from the domain root, so no base path. Getting this wrong on a project
// site 404s every asset; here the risk is the opposite mistake, so it is written down.
export default defineConfig({ base: "/" });
