import path from 'path';

const waitAny = async (f, ...fs) => {
	try {
		return await f();		
	} catch(e) {		
		if (fs.length > 0)
			return waitAny(...fs);
		else
			return Promise.reject(e);
	}
}

const parsePath = (p, prefix = '') => {

	p = path.parse(p);

	if (p.ext.length === 0)
	{
		if (p.name.length === 0)
		{
			p.ext = '.html';
			p.name = 'index';
		}
		else
		{
			p.dir += p.name;
			p.ext = '.js';
			p.name = 'index';
		}
		p.base = p.name + p.ext;
	}

	p = path.join(path.resolve(), prefix, path.format(p));
	p = path.parse(p);

	return p;
};

export { waitAny, parsePath };
