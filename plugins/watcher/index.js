import fs from "fs";
import path from "path";
import colors from "../../colors.js";
import * as FileLoader from "../../loader.js";
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Watcher
let watcher = undefined;

export const close = () => {
    if (watcher)
        watcher.close();
    watcher = undefined;
};

export const watch = (dist, cb) => {
    close();
    watcher = fs.watch(dist, { recursive: true }, cb);
};

export const routes = [
    // Send supervisor script
    {
        if: path => path === '/supervisor.js',
        do: async (_, dist, stream) => {
            await FileLoader.sendFile(path.join(__dirname, 'supervisor.js'), stream);
        }
    },
    // Send refresh event
    {
        if: path => path === '/watch',
        do: (_, dist, stream) => {
            stream.respond({
                'content-type': 'text/event-stream',
                ':status': 200
            });
            watch(dist, () => {
                console.log('refresh');
                stream.write('data: :refresh\n\n');
            });
        }
    },
];

export const log = () => {
    console.log(colors.Message, `To activate hot reload put "<script src="supervisor.js"></script>" inside html or import("supervisor.js") and append it as script`);
};