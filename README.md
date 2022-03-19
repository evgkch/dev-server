# dev-server
Static development server for web applications. It includes the supervisor to hot reolading your project.

## Install
Global: `npm install -g evgkch/dev-server[release]`
Local: `npm install evgkch/dev-server[release]`

## Running
Write in project folder: `dev-server [relative/path/to/dist]`

Project may has a structure below.
```
project
│   dev-server.json
│   ...    
│
└───dist
│   │   index.html
│   │   index.js
│   │   ...
└───...
```

## Config (optional)
To config your server create **dev-server.json** in the project root. Config has two optional fields: ***dist*** and ***resolve***.
The ***dist*** field specifies the path to your distribution. By default, it is equal to the current path. In addition, you can set it as the first argument when calling the `dev-server` command (see the *Usage* paragraph). In this case, this path will have the highest priority.
The ***resolve*** field specifies paths that will be resolved. By default, ***/*** satisfy the ***/index.html***. To change the path to the main html file set `{ '/': '/[your/html].html' }`.
*Note*: all paths should have absolute notation.

## Supervisor
The supervisor reload your browser tab if any **dist** file has changed. After runnig you can see the dev-server message at the terminal:
*"supervisor.js" created at [path/to/dist]. Put it in html as `<script src="/supervisor.js"></script>` to activate the hot reload*. Just use it.
*Note*: don't forget put **supervisor.js** to your **.gitignore** file.

## Example
See the **example** folder. This example project use [js native module system](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules). **You don't need to compile your project anymore!**