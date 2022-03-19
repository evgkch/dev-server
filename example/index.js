import './foo/index.js';
import './bar/index.js';

const msg = `app loaded from ${import.meta.url}`;
const p = document.createElement('p');
p.innerText = msg;
document.body.appendChild(p);
console.log(msg);