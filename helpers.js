import path from 'path';

const parsePath = p => {
		
	p = path.parse(p);

	if (p.name.length === 0)
		p.name = 'index';

	if (p.ext.length === 0)
		p.ext = p.dir === '/' ? '.html' : '.js'
		
	p = path.join(path.resolve(), path.format(p));
	p = path.parse(p);
	
	return p;	
};

export { parsePath };
