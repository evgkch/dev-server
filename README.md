# dev-server
Static development server for web applications.
It includes standart plugins: "watcher" (hot-reload) and "module" (import dependecies from node_modules)

## Install
`git clone https://github.com/evgkch/dev-server.git`

`sudo npm install -g [path/to/repo]`

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
To config your server create **dev-server.config.js** in the project root. Config has four optional fields: ***host***, ***port****,***dist***, ***routes***.
The ***dist*** field specifies the path to your distribution. By default, it is equal to the current path.
The ***routes*** field specifies paths that will be resolved. It has the interface below.

```typescript
interface Config {
    host?: string,
    port?: string,
    dist?: string,
    // Every route is depended on path to dist function of array of conditions and actions
    routes?: Array<(dist: string) => {
        if: (path: string) => boolean,
        do: (path: string, stream: http2.ServerHttp2Stream) => void
    }[]>
}
```