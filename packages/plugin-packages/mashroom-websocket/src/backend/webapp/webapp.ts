
import path from 'path';
import express from 'express';
import {engine} from 'express-handlebars';

import type {Request, Response} from 'express';

const app = express();

app.engine('handlebars', engine({
    defaultLayout: '',
}));
app.set('view engine', 'handlebars');
app.set('views', path.resolve(__dirname, '../../views'));

app.get('/', (req: Request, res: Response) => {
    res.redirect(`${req.baseUrl}/test`);
});

app.get('/test', (req: Request, res: Response) => {
    res.render('test');
});

app.get('/test-client.js', (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, '../public/test-client.js'));
});

export default app;
