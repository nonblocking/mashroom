// @flow

import express from 'express';

import type {$Request as Request, $Response as Response} from 'express';

const app = express();

app.get('/', (req: Request, res: Response) => {
    res.type('text/html');
    res.send(`
        <div>
            <strong>Mashroom</strong> demo webapp is up and running!
        </div>
    `);
});

export default app;
