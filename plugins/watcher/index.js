import fs from "fs";
import path from "path";
import colors from "../../colors.js";
import url from 'url';
import EventEmitter from "events";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Watcher extends EventEmitter {

    static DEBOUNCE = 200;

    _watchers = new Map;
    _cx;

    constructor(props = { dirs: ["."] }) {
        super();
        for (const dir of props.dirs) {
            const watcher = fs.watch(dir, { recursive: true }, event => {
                if (event === 'change') {
                    this._cx = setTimeout(() => this.emit('change'), Watcher.DEBOUNCE);
                }
            });
            this._watchers.set(dir, watcher);
        }
    }

    watch(dir) {
        const watcher = fs.watch(dir, { recursive: true }, () => {
            clearTimeout(this._cx);
            this._cx = setTimeout(() => this.emit('change'), Watcher.DEBOUNCE);
        });
        this._watchers.set(dir, watcher);
    }

    unwatch(dir) {
        const watcher = this._watchers.get(dir);
        if (watcher) {
            watcher.close();
            this._watchers.delete(dir);
        }
    }

    close() {
        for (const dir of this._watchers.keys()) {
            this.unwatch(dir);
        }
        clearTimeout(this._cx);
        this._cx = null;
    }

    init(router) {
        router.set("^\/(.dev.supervisor.js)$", "node_modules/dev-server/plugins/watcher/$1");
        router.set( "^\/:watch$", (_, stream) => {
            stream.respond({
                'content-type': 'text/event-stream',
                ':status': 200
            });
            this.on("change", () => stream.write('data: :refresh\n\n'));
            stream.on("close", () => this.removeAllListeners("change"));
        });
        console.log(colors.Message, `To activate hot reload put "<script src=".dev.supervisor.js"></script>" inside html or import(".dev.supervisor.js") and append it as script`);
    }

}