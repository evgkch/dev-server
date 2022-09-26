const fs = require("fs");
const path = require("path");
const getFileInfo = require("detect-file-encoding-and-language");
const config = require('./config.js');
const colors = require('./colors.js');

const PATH_TO_MIME_TYPES = path.join(config.__dirname, 'files/mime-types.json');
const MimeTypes = JSON.parse(fs.readFileSync(PATH_TO_MIME_TYPES, { encoding: 'utf-8' }));

// Load file by path
async function loadFile(filePath) {
    const fileInfo = await getFileInfo(filePath);
    if (fileInfo && fileInfo.encoding !== 'GB18030')
        return fs.promises.readFile(filePath, fileInfo);
    else
        return fs.promises.readFile(filePath);
}

// file -> content type
function getContentType(filePath) {
    const ext = path.extname(filePath);
    return MimeTypes[ext];
};

async function sendFile(filePath, stream) {
    try {
        const file = await loadFile(filePath);
        stream.respond({
            'accept-ranges': 'bytes',
            'content-length': Buffer.byteLength(file),
            'content-type': getContentType(filePath),
            ':status': 200
        });
        stream.end(file);
    } catch(e) {
        console.log(colors.Message, `Not found ${filePath}`);
        stream.respond({ ':status': 404	});
        stream.end('Not found');
    }
};

module.exports = {
    loadFile,
    getContentType,
    sendFile
};