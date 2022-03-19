import './bar.js';

const msg = `bar module loaded from ${import.meta.url}`;
const p = document.createElement('p');
p.innerText = msg;
document.body.appendChild(p);
console.log(msg);