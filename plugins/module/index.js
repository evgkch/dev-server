const fs = require("fs");
const process = require("process");
const _path = require("path");
const colors = require("../../colors.js");
const FileLoader = require("../../loader.js");

// Module name to module dist map
const cache = new Map;

// Send refresh event
const route = {
    // Check if module in cache or does not exist in dist folder
    if: (path, dist) => cache.has(path) || !fs.existsSync(_path.join(dist, path)),
    do: async (path, _, stream) => {
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
};

const log = () => {
    console.log(colors.Message, `Modules resolver connected. It will be try to find module in node_modules if requested path does not exist`);
};

module.exports = {
    route,
    log
};