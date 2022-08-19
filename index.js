#!/usr/bin/env -S node --experimental-modules

import http2 from 'http2';
import fs from 'fs';
import process from 'process';
import path from 'path';
import config from './config.js';
import colors from './colors.js';
import * as FileLoader from "./loader.js";
import { PATH_TO_CERT, PATH_TO_KEY } from './certs.js';

export { FileLoader };
export * as Plugins from './plugins/index.js';

const Router = ({ config }) => {

    const PATH_TO_DIST = path.join(process.cwd(), config.dist);
    const PATH_TO_INDEX = path.join(PATH_TO_DIST, 'index.html');

    // Create routes from main route and config.routes
    const routes = [
        {
            if: path => path === '/',
            do: async (_, stream) => {
                await FileLoader.sendFile(PATH_TO_INDEX, stream);
            }
        },
        ...config.routes
    ];

    const route = async (stream, headers) => {
        const route = routes.find(route => route.if(headers[':path']));
        if (route)
            route.do(headers[':path'], stream);
        else
            await FileLoader.sendFile(path.join(PATH_TO_DIST, headers[':path']), stream);
    };

    return { route };
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

async function upgradeConfig() {
    const PATH_TO_DEFAULT_CONFIG = path.join(config.__dirname, 'files/dev-server.config.js');
    const PATH_TO_USER_CONFIG = path.join(process.cwd(), 'dev-server.config.js');

    if (!fs.existsSync(PATH_TO_USER_CONFIG)) {
        fs.cpSync(PATH_TO_DEFAULT_CONFIG, PATH_TO_USER_CONFIG);
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
        if (userConfig.routes) {
            config.routes = userConfig.routes.flatMap(route => route(config.dist));
        }
    } catch(err) {
        console.log(colors.Message, err);
        process.exit(1);
    }

};

async function main() {

    await upgradeConfig();

    const router = Router({ config });
    const server = DevServer({ config, router });

    server.run();

}

main();