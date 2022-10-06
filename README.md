# dev-server
Static development server for web applications.
It includes standart plugins: "watcher" (hot-reload) and "module" (import dependecies from node_modules)

## Installation

### Manual Global Installation

`git clone https://github.com/evgkch/dev-server.git`

`cd [path/to/repo] && npm i`

`sudo npm install -g .`

If execution has error "Error: Cannot find module 'dev-server'":
- Find global node_modules location (`npm root -g`)
- `export NODE_PATH=[The path above]`

### Through package.json

Add to devDependencies:

`{
    ...
    "dev-server": "git+https://github.com/evgkch/dev-server.git"
    ...
}`

Or with fix version

`{
    ...
    "dev-server": "git+https://github.com/evgkch/dev-server.git#3.2.0"
    ...
}`

## Init

`dev-server --init`

Created `dev-server.config.js` with standart plugins and presets

## Running
After init write in project folder: `dev-server`

Project may has a structure below.
```
project
│   dev-server.config.js
│   ...
│
└───dist
│   │   index.html
│   │   index.js
│   │   ...
└───...
```

## Config (optional)

To config your server create **dev-server.config.js** in the project root. Config has four optional fields: ***host***, ***port****,***dist***, ***routes*** and ***plugins***.
The ***dist*** field specifies the path to your distribution. By default, it is equal to the current path.
The ***routes*** field specifies paths that will be resolved.