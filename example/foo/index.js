import './foo.js';

const msg = `foo module loaded from ${import.meta.url}`;
const p = document.createElement('p');
p.innerText = msg;
document.body.appendChild(p);
console.log(msg);