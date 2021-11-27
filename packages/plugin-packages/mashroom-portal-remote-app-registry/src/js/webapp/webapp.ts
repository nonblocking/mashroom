
import path from 'path';
import express, {Router} from 'express';
import {engine} from 'express-handlebars';
import bodyParser from 'body-parser';
import index from './routes';
import {adminIndex, adminUpdate} from './routes/admin';
import {getRemotePortalApps, addRemotePortalAppUrl, deleteRemotePortalAppUrl} from './routes/api';

const app = express();

const admin = express();
admin.use(bodyParser.urlencoded({
    extended: true,
}));

admin.engine('handlebars', engine({
    defaultLayout: '',
}));
admin.set('view engine', 'handlebars');
admin.set('views', path.resolve(__dirname, '../../views'));

admin.use(express.static(path.resolve(__dirname, '../../public')));

admin.get('/', adminIndex);
admin.post('/', adminUpdate);

const api = Router();
api.use(bodyParser.json());

api.get('/', getRemotePortalApps);
api.post('/', addRemotePortalAppUrl);
api.delete('/:url', deleteRemotePortalAppUrl);

app.use('/admin', admin);
app.use('/api', api);
app.get('/', index);

export default app;
