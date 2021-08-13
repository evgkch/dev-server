import path from 'path';

const parsePath = (p, distFolder = '') => {

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

	p = path.join(path.resolve(), distFolder, path.format(p));
	p = path.parse(p);

	return p;
};

export { parsePath };
