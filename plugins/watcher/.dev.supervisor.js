// Flag to force page reload after activation
// if the project has been modified
let needForceReload = false;
const es = new EventSource("/:watch");
es.onmessage = evt => {
    switch(evt.data)
    {
    case ':refresh':
        if (document.hidden)
            needForceReload = true;
        else
            window.location.reload();
        break;
    default:
        console.warn('Unknown sse command', evt);
        break;
    }
};
es.onopen = () => {
    console.info('Supervisor activated');
};
es.onclose = () => {
    console.info('Supervisor deactivated');
};
es.onerror = (_, ev) => {
    console.log(ev);
};
document.onvisibilitychange = () => {
    if (!document.hidden && needForceReload)
    {
        window.location.reload();
        needForceReload = false;
    }
};
document.onunload = () => {
    es.close();
};