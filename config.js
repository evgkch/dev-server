import url from 'url';
import path from "path";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    __dirname,
    hostname: '127.0.0.1',
    port: 3000,
    dist: '.',
    routes: []
}