import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { libInjectCss } from "vite-plugin-lib-inject-css";
import { extname, relative, resolve } from "path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import pkg from "./package.json";

// All packages to externalize (don't bundle)
const externalPackages = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    "react",
    "react-dom",
    "react/jsx-runtime",
    "react/jsx-dev-runtime",
    "react-dom/client",
    "react-icons",
    "react-icons/md",
    "react-icons/tb",
    "react-icons/vsc",
    "pyodide",
];

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), libInjectCss(), dts({ include: ["lib"] })],
    build: {
        copyPublicDir: false,
        lib: {
            entry: resolve(__dirname, "lib/main.ts"),
            formats: ["es"],
        },
        rollupOptions: {
            external: (id: string) => {
                return externalPackages.some(
                    (pkg) => id === pkg || id.startsWith(`${pkg}/`)
                );
            },
            input: Object.fromEntries(
                glob.sync("lib/**/*.{ts,tsx}").map((file) => [
                    // The name of the entry point
                    // lib/nested/foo.ts becomes nested/foo
                    relative("lib", file.slice(0, file.length - extname(file).length)),
                    // The absolute path to the entry file
                    // lib/nested/foo.ts becomes /project/lib/nested/foo.ts
                    fileURLToPath(new URL(file, import.meta.url)),
                ])
            ),
            output: {
                globals: {
                    react: "React",
                    "react-dom": "ReactDOM",
                },
                assetFileNames: "assets/[name][extname]",
                entryFileNames: "[name].js",
            },
        },
    },
});
