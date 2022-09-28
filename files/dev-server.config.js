#!/usr/bin/env -S node --experimental-modules
import { Plugins } from "dev-server";

export default {
    dist: 'dist',
    routes: [
        ...Plugins.FileWatcher.routes,
        Plugins.Module.route
    ]
}

Plugins.FileWatcher.log();
Plugins.Module.log();