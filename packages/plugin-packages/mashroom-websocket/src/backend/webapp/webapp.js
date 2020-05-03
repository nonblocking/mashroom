// @flow

import path from 'path';
import express from 'express';
import exphbs from 'express-handlebars';

import type {ExpressRequest, ExpressResponse} from '@mashroom/mashroom/type-definitions';

const app = express<ExpressRequest, ExpressResponse>();

app.engine('handlebars', exphbs({
    defaultLayout: '',
}));
app.set('view engine', 'handlebars');
app.set('views', path.resolve(__dirname, '../../views'));

app.get('/', (req: ExpressRequest, res: ExpressResponse) => {
    res.redirect(req.baseUrl + '/test');
});

app.get('/test', (req: ExpressRequest, res: ExpressResponse) => {
    res.render('test');
});

app.get('/test_client.js', (req: ExpressRequest, res: ExpressResponse) => {
    res.sendFile(path.resolve(__dirname, '../public/test_client.js'));
});

export default app;
