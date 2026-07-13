
import path from 'path';
import express from 'express';
import {engine} from 'express-handlebars';
import bodyParser from 'body-parser';
import {adminIndex, adminUpdate} from './routes/admin';

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

app.use(admin);

export default app;
