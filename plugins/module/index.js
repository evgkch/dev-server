import fs from "fs";
import process from "process";
import _path from "path";
import colors from "../../colors.js";
import * as FileLoader from "../../loader.js";
import { getDist } from "../../index.js";

// Module name to module dist map
const cache = new Map;

// Send refresh event
export const route = {
    // Check if module in cache or does not exist in dist folder
    if: path => cache.has(path) || !fs.existsSync(_path.join(getDist(), path)),
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
        await FileLoader.sendFile(stream, cache.get(path));
    }
};

export const log = () => {
    console.log(colors.Ok, `Modules resolver connected. It will be try to find module in node_modules if requested path does not exist`);
};