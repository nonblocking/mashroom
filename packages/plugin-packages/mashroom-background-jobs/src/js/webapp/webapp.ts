
import path from 'path';
import express from 'express';
import exphbs from 'express-handlebars';
import index from './routes';
import {adminIndex} from './routes/admin';

const app = express();

const admin = express();

admin.engine('handlebars', exphbs({
    defaultLayout: '',
}));
admin.set('view engine', 'handlebars');
admin.set('views', path.resolve(__dirname, '../../views'));

admin.use(express.static(path.resolve(__dirname, '../../public')));

admin.get('/', adminIndex);

app.use('/admin', admin);
app.get('/', index);

export default app;
