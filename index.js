#!/usr/bin/env -S node --experimental-modules

import http2 from 'http2';
import fs from 'fs';
import url from 'url';
import process from 'process';
import path from 'path';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
	Error: '\x1b[41m%s\x1b[0m',
	Message: '\x1b[33m%s\x1b[0m',
	Ok: '\x1b[32m%s\x1b[0m'
};

JSON.fetch = async function(filePath) {
    return JSON.parse(await fs.promises.readFile(filePath, 'utf-8'))
};

const serverConfig = {
    hostname: '127.0.0.1',
    port: 3000
};

const userConfig = {
    dist: process.cwd(),
    resolve: {}
};

const FileLoader = async () => {

    const types = {};

    try {
        Object.assign(types, await JSON.fetch(`${__dirname}/files/mime-types.json`));
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
        resolve: Object.assign({
            '/': '/index.html'
        }, userConfig.resolve)
    };

    const resolve = (pathToFile) => {
        if (pathToFile in config.resolve)
            pathToFile = config.resolve[pathToFile];
        return path.join(config.dist, pathToFile);
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

    const CERT_FOLDER = 'private';

    const server = http2.createSecureServer({
        key: fs.readFileSync(`${__dirname}/${CERT_FOLDER}/key.pem`),
        cert: fs.readFileSync(`${__dirname}/${CERT_FOLDER}/cert.pem`)
    });

    const run = () => {
        server.listen(serverConfig.port, serverConfig.hostname, () => {
            console.log(colors.Ok, `Server listening on ${serverConfig.hostname}:${serverConfig.port}`);
        });
    };

    server.on('stream', router.route);
    server.on('error', async err => {
		switch (err.code)
		{
		case 'EADDRINUSE':
			server.close();
            serverConfig.port++;
            return DevServer(router).run();
		default:
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
        const config = await JSON.fetch(path.join(userConfig.dist, 'dev-server.json'));
        userConfig.dist = path.join(userConfig.dist, dist || config.dist || '');
        if (config.resolve)
            Object.assign(userConfig.resolve, config.resolve);
    } catch(e) {}
};

const injectSupervisor = () => {
    // If dist is the argument it has max priority to be set
    if (!fs.existsSync(path.join(userConfig.dist, 'supervisor.js')))
        fs.copyFile(`${__dirname}/files/supervisor.js`, path.join(userConfig.dist, 'supervisor.js'), (err) => {
            if (!err)
                console.log(colors.Message, `message:\n    "supervisor.js" created at "${userConfig.dist}".\n    Put it in html as "<script src="/supervisor.js"></script>" to activate the hot reload`);
            else
                console.warn(colors.Message, `message:\n    Can\'t create "supervisor.js".\n    Hot reload will not work`);
        });
    else
        console.log(colors.Message, `message:\n    "supervisor.js" already created at "${userConfig.dist}".\n    Put it in html as "<script src="/supervisor.js"></script>" to activate the hot reload`);
};

async function main() {

    await upgradeUserConfig();
    injectSupervisor();

    // Init all classes
    const fileLoader = await FileLoader();
    const fileWatcher = FileWatcher();
    const router = Router({ userConfig, fileLoader, fileWatcher });
    const server = DevServer({ serverConfig, router });

    server.run();

}

main();