#!/usr/bin/env node --experimental-modules

import http2 from 'http2'
import fs from 'fs'
import cp from 'child_process'
import process from 'process'
import util from 'util'
import ph from 'path'

import config from './config.js'
import { parsePath } from './helpers.js'

const exec = util.promisify(cp.exec);

const GLOBAL_LIB_PATH = '/usr/local/lib/node_modules/dev-server';
const LOCAL_LIB_PATH = 'node_modules/dev-server';

const argv = process.argv.slice(2);

main();

async function main() {
	let mime_types;

	try {
		mime_types = await fs.promises.readFile(ph.join(GLOBAL_LIB_PATH, 'mime-types.json'), 'utf-8').then(JSON.parse)
	} catch(e) {
		try {
			mime_types = await fs.promises.readFile(ph.join(LOCAL_LIB_PATH, 'mime-types.json'), 'utf-8').then(JSON.parse)
		} catch(e) {
			console.log(e);
			console.log('Can\'t read or parse mime-types.json');
			process.exit(1);
		}
	}

	try {
		await exec('mkdir -p .https');
		await exec('openssl req -newkey rsa:4096 -new -nodes -x509 -days 3650 -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=www.example.com" -keyout .https/key.pem -out .https/cert.pem');
	} catch(e) {
		console.log(e);
	}

	const server = http2.createSecureServer({
		key : fs.readFileSync('.https/key.pem'),
		cert: fs.readFileSync('.https/cert.pem')
	});

	server.on('error', err => console.log(err))

	server.on('stream', (stream, headers) => {

		let path        = headers[':path'],                 // Get the path
			method      = headers[':method'].toLowerCase(); // Get the HTTP method

		if (method !== 'get')
		{
			stream.respond({
				':status': 500
			});
			stream.end('Not found');
		}

		path = parsePath(path, argv[0]);

		fs.promises.readFile(ph.format(path), 'utf-8')
			.then(file => {

				const contentType = mime_types[path.ext];

				// stream is a Duplex
				stream.respond({
					'content-type': contentType,
					':status'     : 200
				});
				stream.end(file);

			})
			.catch(err => {

				console.error(err);

				stream.respond({
					':status': 404
				});
				stream.end('Not found');

			});
	})

	server.listen(config.port, config.hostname, () => {
		try {
			let openCommand = '';
			switch (process.platform)
			{
			case 'darwin':
				openCommand = 'open -a "Google Chrome"';
				break;
			default:
				openCommand = 'start chrome';
				break;
			}

			exec(openCommand + ' ' + config.protocol + '://' + config.hostname + ':' + config.port);
		} catch(e) {}
		console.log('Server listening on ' + config.hostname + ':' + config.port);
	})

}
