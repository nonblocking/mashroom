

import express from 'express';

// Using the Mashroom types here is optional
import {ExpressRequest, ExpressResponse} from '@mashroom/mashroom/type-definitions';

const app = express<ExpressRequest, ExpressResponse>();

app.get('/', (req: ExpressRequest, res: ExpressResponse) => {
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
