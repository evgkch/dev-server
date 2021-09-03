#!/usr/bin/env node --experimental-modules

import http2 from 'http2';
import fs from 'fs';
import cp from 'child_process';
import process from 'process';
import util from 'util';
import ph from 'path';

import { waitAny, parsePath } from './helpers.js';

import config from './config.js';

const exec = util.promisify(cp.exec);

const [path_to_dist_folder] = process.argv.slice(2);

main();

const colors = {
	Error: '\x1b[41m%s\x1b[0m',
	Message: '\x1b[33m%s\x1b[0m',
	Ok: '\x1b[32m%s\x1b[0m'
};

const methods = {
	GET: 'get'
}

// Paths to resolve
const paths = {};

let cx;

async function main() {
	let mime_types;
	
	mime_types = await getMimeTypes();
	await generateCertificates();	

	const server = http2.createSecureServer({
		key: fs.readFileSync('.https/key.pem'),
		cert: fs.readFileSync('.https/cert.pem')
	});

	await parseDevConfig();
	// fs.watch(`${path_to_dist_folder}`, { recursive: true }, console.log);

	server.on('stream', (stream, headers) => {

		let path = headers[':path'],
			method = headers[':method'].toLowerCase();

		if (method !== methods.GET)
		{
			stream.respond({ ':status': 500 });
			stream.end('Not found');
		}

		let resolved = false;
		for (let pathToResolve in paths)
		{
			if (path.match(pathToResolve))
			{
				path.replace(pathToResolve, paths[pathToResolve]);
				path = ph.resolve(path);
				resolved = true;
				continue;
			}
		}

		if (!resolved)
			path = parsePath(path, path_to_dist_folder);

		fs.promises.readFile(ph.format(path), 'utf-8')
			.then(file => {
				const contentType = mime_types[path.ext];
				// stream is a Duplex
				stream.respond({
					'content-type': contentType,
					':status': 200
				});
				stream.end(file);
			})
			.catch(err => {
				console.log(colors.Message, `Not found ${err.path}`);
				stream.respond({ ':status': 404	});
				stream.end('Not found');
			});
							
	});

	server.on('error', err => {
		switch (err.code)
		{
		case 'EADDRINUSE':
			config.port += 1;
			listen(server, config.hostname, config.port);
			break;
		default:
			console.log(colors.Message, err);
		}				
	});	

	listen(server, config.hostname, config.port);

}

async function parseDevConfig() {
	try {
		const dsconfig = fs.promises.readFile('./dsconfig.json', 'utf-8');
		if (dsconfig.hostname)
			config.hostname = dsconfig.hostname;
		if (dsconfig.paths)
			Object.assign(paths, dsconfig.paths);
	} catch(e) {}
}

async function getMimeTypes() {
	try {
		return await waitAny(
			() => fs.promises.readFile(ph.join(config.GLOBAL_MODULE_PATH, 'static', 'mime-types.json'), 'utf-8').then(JSON.parse),
			() => fs.promises.readFile(ph.join(config.LOCAL_MODULE_PATH, 'static', 'mime-types.json'), 'utf-8').then(JSON.parse)
		);
	} catch(e) {		
		console.log(colors.Error, 'Can\'t read or parse mime-types.json');
		console.log(colors.Message, e);
		process.exit(1);
	}
}

async function generateCertificates() {	
	try {
		await exec('mkdir -p .https');
		await exec('openssl req -newkey rsa:4096 -new -nodes -x509 -days 3650 -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=www.example.com" -keyout .https/key.pem -out .https/cert.pem');
	} catch(e) {
		console.log(colors.Error, 'Can\'t generate certificates');
		console.log(colors.Message, e);
		process.exit(1);
	}
}

function listen(server, hostname, port) {
	server.listen(port, hostname, () => {
		clearTimeout(cx);
		cx = setTimeout(async () => {
			await openBrowser();
			console.log(colors.Ok, `Server listening on ${hostname}:${port}`);
		}, 100);		
	})
}

async function openBrowser() {
	try {	
		const res = await exec(`open -a "Google Chrome" ${config.protocol}://${config.hostname}:${config.port}`);		
	} catch(e) {}
}
