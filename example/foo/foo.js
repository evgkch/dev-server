const msg = `foo.js loaded from ${import.meta.url}`;
const p = document.createElement('p');
p.innerText = msg;
document.body.appendChild(p);
console.log(msg);