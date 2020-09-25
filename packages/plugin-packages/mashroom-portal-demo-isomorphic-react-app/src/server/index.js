const express = require('express');
const path = require('path');
const React = require('react');
const ReactDOM = require('react-dom/server');
const { default: App } = require('../frontend/js/App');

const app = express();
const PORT = 8084;

app.use(express.static(path.resolve(__dirname, '..', '..', 'public')));

if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line global-require
    const devMiddleware = require('./middleware/devMiddleware');
    app.use(devMiddleware);

    app.get('/isomorphic', (req, res) => {
        const html = ReactDOM.renderToString(<App appConfig={{ firstName: 'Michael' }} />);
        res.send(`<!doctype html>
<html>
<head>
<title></title>
<script src="bundle.js"></script>
</head>
<body>
<div id="demo-react-app-container">${html}</div>
<script>
        var portalAppSetup = {
            lang: 'en',
            appConfig: {
                firstName: 'Michael'
            },
        };
        var portalClientServices = {
            messageBus: {
                publish: function () { console.log('server ping'); },
                subscribe: function () { }
            }
        };
        var element = document.getElementById("demo-react-app-container");
        window.startIsomorphicReactDemoApp(element, portalAppSetup, portalClientServices);
</script>
</body>
</html>`);
    });
}

app.get('/widget', (req, res) => {
    const html = ReactDOM.renderToString(<App appConfig={{}} />);
    res.send(html);
});

app.listen(PORT, () => {
    console.log(`Server listening at port ${PORT}`);
});
