import path from "path";
import process from 'process';
import { exec } from 'child_process';
import config from "./config.js";
import colors from './colors.js';

const folder = path.join(config.__dirname, '.certs');

export const PATH_TO_KEY = path.join(folder, 'key.pem');
export const PATH_TO_CERT = path.join(folder, 'cert.pem');

exec(`mkdir -p ${folder}`)
// Generate Certs
exec(`openssl req \
    -newkey rsa:4096 \
    -new \
    -nodes \
    -x509 \
    -days 3650 \
    -subj "/C=RU/ST=Developer/L=Moscow/O=Dis/CN=localhost" \
    -keyout ${folder}/key.pem \
    -out ${folder}/cert.pem`, err => {
        if (err) {
            console.log(colors.Error, `Can't generate certs:`, err);
            process.exit(1);
        }
});