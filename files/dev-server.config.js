import { Plugins } from "dev-server";

export default {
    dist: '.',
    routes: [
        Plugins.FileWatcher.routes,
        Plugins.Module.routes
    ]
}