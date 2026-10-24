import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
export default defineConfig({ base: process.env.BASE_PATH || "/", plugins: [glsl()], server: { host: true, port: 5173 }, build: { target: "es2022" } });
