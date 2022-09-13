const url = require('url');
const path = require("path");

//const __filename = url.fileURLToPath(module.meta.url);
//const __dirname = path.dirname(__filename);

module.exports = {
    __dirname,
    hostname: '127.0.0.1',
    port: 3000,
    dist: '.',
    routes: []
}