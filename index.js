#!/usr/bin/env -S node --experimental-modules

import http2 from 'http2';
import fs from 'fs';
import process from 'process';
import path from 'path';
import config from './config.js';
import colors from './colors.js';
import * as FileLoader from "./loader.js";
import { PATH_TO_CERT, PATH_TO_KEY } from './certs.js';
export * as Plugins from './plugins/index.js';
export * as FileLoader from './loader.js'

const Router = ({ config }) => {

    const PATH_TO_DIST = path.join(process.cwd(), config.dist);

    // Create routes from main route and config.routes
    const routes = [];

    const set = (regex, replacer) => {
        routes.push([new RegExp(regex), replacer]);
    };

    for (let regex in config.routes) {
        set(regex, config.routes[regex]);
    }

    const route = async (stream, headers) => {
        const route = routes.find(route => headers[':path'].match(route[0]));
        if (route) {
            if (typeof route[1]  === 'string') {
                await FileLoader.sendFile(path.join(process.cwd(), headers[':path'].replace(route[0], route[1])), stream);
            } else {
                route[1](path.join(process.cwd(), headers[':path']), stream);
            }
        } else {
            await FileLoader.sendFile(path.join(PATH_TO_DIST, headers[':path']), stream);
        }
    };

    return { route, set };
};

const DevServer = ({ config, router }) => {

    const server = http2.createSecureServer({
        key: fs.readFileSync(PATH_TO_KEY),
        cert: fs.readFileSync(PATH_TO_CERT)
    });

    const run = () => {
        server.listen(config.port, config.hostname, () => {
            console.log(colors.Ok, `Server listening on https://${config.hostname}:${config.port}`);
        });
    };
    server.on('stream', router.route);
    server.on('error', async err => {
		switch (err.code)
		{
		case 'EADDRINUSE':
			server.close();
            config.port++;
            return DevServer({ config, router }).run();
		default:
            server.close();
			console.log(colors.Message, err);
		}
	});

    return { run };
};

async function init() {
    const PATH_TO_DEFAULT_CONFIG = path.join(config.__dirname, 'files/dev-server.config.js');
    const PATH_TO_USER_CONFIG = path.join(process.cwd(), 'dev-server.config.js');

    if (!fs.existsSync(PATH_TO_USER_CONFIG)) {
        fs.cpSync(PATH_TO_DEFAULT_CONFIG, PATH_TO_USER_CONFIG);
        console.log(colors.Message, `dev-server.config.js create in current dir`);
    }

    try {
        const userConfig = await import(PATH_TO_USER_CONFIG).then(m => m.default);
        if (userConfig.hostname) {
            config.hostname = userConfig.hostname;
        }
        if (userConfig.port) {
            config.port = userConfig.port;
        }
        if (userConfig.dist) {
            config.dist = userConfig.dist;
        }
        config.routes = userConfig.routes || {};
        config.plugins = userConfig.plugins || [];
    } catch(err) {
        console.log(colors.Message, err);
        process.exit(1);
    }

};

async function dev() {

    await init();

    const router = Router({ config });
    const server = DevServer({ config, router });

    for (const plugin of config.plugins) {
        plugin.init(router);
    }

    server.run();

}

const [options] = process.argv.slice(2);

switch (options) {
    case '--init':
        init();
        break;
    default:
        dev();
}