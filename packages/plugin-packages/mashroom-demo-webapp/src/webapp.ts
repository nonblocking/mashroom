
import express from 'express';

const app = express();

app.get('/', (req, res) => {
    const logger = req.pluginContext.loggerFactory('demo.webapp');
    logger.info('Hello from Mashroom Demo Webapp');

    res.type('text/html');
    res.send(`
        <div>
            <strong>Mashroom</strong> demo webapp is up and running!
        </div>
    `);
});

export default app;
