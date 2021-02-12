
import express from 'express';

// Using the Mashroom types here is optional
import type {ExpressRequest} from '@mashroom/mashroom/type-definitions';

const app = express();

app.get('/', (req, res) => {
    const requestWithContext = req as ExpressRequest;
    const logger = requestWithContext.pluginContext.loggerFactory('demo.webapp');
    logger.info('Hello from Mashroom Demo Webapp');

    res.type('text/html');
    res.send(`
        <div>
            <strong>Mashroom</strong> demo webapp is up and running!
        </div>
    `);
});

export default app;
