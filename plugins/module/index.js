import fs from "fs";
import process from "process";
import _path from "path";
import * as FileLoader from "../../loader.js";
import colors from "../../colors.js";

// Module name to module dist map
const cache = new Map;

export const routes = (dist) => [
    // Send refresh event
    {
        // Check if module in cache or does not exist in dist folder
        if: path => cache.has(path) || !fs.existsSync(_path.join(dist, path)),
        do: async (path, stream) => {
            // If module is not in the cache trying to find it
            if (!cache.has(path)) {
                try {
                    // Trying to load and parse package.json
                    const config = JSON.parse(
                        await FileLoader.loadFile(_path.join(process.cwd(), 'node_modules', path, 'package.json'))
                    );
                    // Trying to get module dist folder and set it to the cache
                    const dist = config.main || config.browser;
                    if (dist) {
                        cache.set(path, _path.join(process.cwd(), 'node_modules', path, dist));
                    }
                } catch(err) {}
            }
            // Sending file
            await FileLoader.sendFile(cache.get(path), stream);
        }
    },
];

export const log = () => {
    console.log(colors.Ok, `Modules resolver connected. It will be try to find module in node_modules if requested path does not exist`);
}