#!/usr/bin/env -S node --experimental-modules
import { Plugins } from "dev-server";

export default {
    dist: '.',
    routes: {
        "^\/$": "static/index.html"
    },
    plugins: [
        new Plugins.Watcher
    ]
}