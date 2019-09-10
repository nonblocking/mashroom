// @flow

import path from 'path';
import express from 'express';
import exphbs from 'express-handlebars';

import type {$Request as Request, $Response as Response} from 'express';

const app = express();

app.engine('handlebars', exphbs({
}));
app.set('view engine', 'handlebars');
app.set('views', path.resolve(__dirname, '../../views'));

app.get('/', (req: Request, res: Response) => {
    res.sendStatus(405);
});

app.get('/test', (req: Request, res: Response) => {
    res.render('test');
});

app.get('/test_client.js', (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, '../public/test_client.js'));
});

export default app;
