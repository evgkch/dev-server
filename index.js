#!/usr/bin/env -S node --experimental-modules

import http2 from 'http2';
import fs from 'fs';
import url from 'url';
import process from 'process';
import path from 'path';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

JSON.fetch = async function(filePath) {
    return JSON.parse(await fs.promises.readFile(filePath, 'utf-8'))
};

const paths = {
    KEY: path.join(__dirname, 'private/key.pem'),
    CERT: path.join(__dirname, 'private/cert.pem'),
    MIME_TYPES: path.join(__dirname, 'files/mime-types.json'),
    SUPERVISOR: path.join(__dirname, 'files/supervisor.js'),
    DEV_SERVER: path.join(process.cwd(), 'dev-server.json')
};

const colors = {
	Error: '\x1b[41m%s\x1b[0m',
	Message: '\x1b[33m%s\x1b[0m',
	Ok: '\x1b[32m%s\x1b[0m'
};

const serverConfig = {
    hostname: '127.0.0.1',
    port: 3000
};

const userConfig = {
    dist: '.',
    resolve: {}
};

const FileLoader = async () => {

    const types = {};

    try {
        Object.assign(types, await JSON.fetch(paths.MIME_TYPES));
    } catch(e) {
        console.error('error: Can\'t read or parse "mime-types.json"', e);
        process.exit(1);
    }

    const getContentType = (pathToFile) => {
        const ext = path.extname(pathToFile);
        return types[ext];
    };

    const fetch = (pathToFile) => {
        return fs.promises.readFile(pathToFile, 'utf-8');
    };

    return { getContentType, fetch };
};

const FileWatcher = () => {
    let watcher;

    const close = () => {
        if (watcher)
            watcher.close();
        watcher = undefined;
    };

    const watch = (dist, cb) => {
        close();
        watcher = fs.watch(dist, { recursive: true }, cb);
    };

    return { watch, close };
};

const Router = ({ userConfig, fileLoader, fileWatcher }) => {

    const config = {
        dist: userConfig.dist,
        resolve: {
            '/': path.join('/', userConfig.dist, 'index.html'),
            ...userConfig.resolve
        }
    };

    const resolve = (pathToFile) => {
        if (pathToFile === '/supervisor.js')
            return paths.SUPERVISOR;
        else if (pathToFile in config.resolve)
            return path.join(process.cwd(), config.resolve[pathToFile]);
        else
            return path.join(process.cwd(), config.dist, pathToFile);
    };

    const loadFile = async (stream, headers) => {
        const path = resolve(headers[':path']);
        try {
            const file = await fileLoader.fetch(path);
            stream.respond({
                'content-type': fileLoader.getContentType(path),
                ':status': 200
            });
            stream.end(file);
        } catch(e) {
            console.log(colors.Message, `Not found ${path}`, e);
            stream.respond({ ':status': 404	});
            stream.end('Not found');
        }
    };

    const watchFolder = (stream) => {
        stream.respond({
            'content-type': 'text/event-stream',
            ':status': 200
        });
        fileWatcher.watch(config.dist, () => {
            stream.write('data: :refresh\n\n');
        });
    };

    const route = async (stream, headers) => {
        if (headers[':path'] === '/watch')
            watchFolder(stream, headers);
        else
            await loadFile(stream, headers);
    };

    return { route };
};

const DevServer = ({ serverConfig, router }) => {

    const server = http2.createSecureServer({
        key: fs.readFileSync(paths.KEY),
        cert: fs.readFileSync(paths.CERT)
    });

    const run = () => {
        server.listen(serverConfig.port, serverConfig.hostname, () => {
            console.log(colors.Ok, `Server listening on https://${serverConfig.hostname}:${serverConfig.port}`);
            console.log(colors.Message, `Put "<script src="supervisor.js"></script>" inside html to activate the hot reload`);
        });
    };

    server.on('stream', router.route);
    server.on('error', async err => {
		switch (err.code)
		{
		case 'EADDRINUSE':
			server.close();
            serverConfig.port++;
            return DevServer({ serverConfig, router }).run();
		default:
            server.close();
			console.log(colors.Message, err);
		}
	});

    return { run };
};

const upgradeUserConfig = async () => {
    // Getting args
    const [dist, ...args] = process.argv.slice(2);

    // Try to read and parse dev-server.json to update userConfig
    try {
        let config = {};
        if (fs.existsSync(paths.DEV_SERVER))
            config = await JSON.fetch(paths.DEV_SERVER);
        userConfig.dist = dist || config.dist || userConfig.dist;
        if (config.resolve)
            Object.assign(userConfig.resolve, config.resolve);
    } catch(e) {
        console.log(e);
    }
};

async function main() {

    await upgradeUserConfig();

    // Init all classes
    const fileLoader = await FileLoader();
    const fileWatcher = FileWatcher();
    const router = Router({ userConfig, fileLoader, fileWatcher });
    const server = DevServer({ serverConfig, router });

    server.run();

}

main();