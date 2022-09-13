
import express from 'express';
import registry from './registry';
import type {Request, Response} from 'express';

export default () => {
    const app = express();

    app.get('/', async (req: Request, res: Response) => {
        res.set('Content-Type', registry.contentType);
        res.end(await registry.metrics());
    });

    return app;
};
