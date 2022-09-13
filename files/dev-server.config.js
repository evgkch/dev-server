#!/usr/bin/env -S node --experimental-modules
const { Plugins } = require("dev-server");

module.exports = {
    dist: '.',
    routes: [
        ...Plugins.FileWatcher.routes,
        Plugins.Module.route
    ]
}

Plugins.FileWatcher.log();
Plugins.Module.log();