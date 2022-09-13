const fs = require("fs");
const url = require('url');
const path = require("path");
const colors = require("../../colors.js");
const FileLoader = require("../../loader.js");
const { dist } = require("../../config.js");

//const __filename = url.fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

// Watcher
let watcher = undefined;

const close = () => {
    if (watcher)
        watcher.close();
    watcher = undefined;
};

const watch = (dist, cb) => {
    close();
    watcher = fs.watch(dist, { recursive: true }, cb);
};

const routes = [
    // Send supervisor script
    {
        if: path => path === '/supervisor.js',
        do: async (_, stream) => {
            await FileLoader.sendFile(stream, path.join(__dirname, 'supervisor.js'));
        }
    },
    // Send refresh event
    {
        if: path => path === '/watch',
        do: (_, stream) => {
            stream.respond({
                'content-type': 'text/event-stream',
                ':status': 200
            });
            watch(dist, () => {
                stream.write('data: :refresh\n\n');
            });
        }
    },
];

const log = () => {
    console.log(colors.Message, `To activate hot reload put "<script src="supervisor.js"></script>" inside html or import("supervisor.js") and append it as script`);
};

module.exports = {
    close,
    watch,
    routes,
    log
};