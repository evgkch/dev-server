import fs from "fs";
import path from "path";
import getFileInfo from "detect-file-encoding-and-language";
import config from './config.js';
import colors from './colors.js';

const PATH_TO_MIME_TYPES = path.join(config.__dirname, 'files/mime-types.json');
const MimeTypes = JSON.parse(fs.readFileSync(PATH_TO_MIME_TYPES, { encoding: 'utf-8' }));
const encoding_exceptions = ['GB18030', 'CP1252'];

// Load file by path
export async function loadFile(filePath) {
    const fileInfo = await getFileInfo(filePath);
    if (fileInfo && encoding_exceptions.every(e => e !== fileInfo.encoding))
        return fs.promises.readFile(filePath, fileInfo);
    else
        return fs.promises.readFile(filePath);
}

// file -> content type
export function getContentType(filePath) {
    const ext = path.extname(filePath);
    return MimeTypes[ext];
};

export async function sendFile(filePath, stream) {
    try {
        const file = await loadFile(filePath);
        stream.respondWithFile(filePath, {
            'accept-ranges': 'bytes',
            'content-length': Buffer.byteLength(file),
            'content-type': getContentType(filePath),
            ':status': 200
        }, {
            length: Buffer.byteLength(file)
        });
    } catch(e) {
        console.log(colors.Message, `Not found ${filePath}`);
        stream.respond({ ':status': 404	});
        stream.end('Not found');
    }
};