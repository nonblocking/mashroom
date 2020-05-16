
import path from 'path';
import express from 'express';
import exphbs from 'express-handlebars';
import services from './routes/services';

const app = express();

app.engine('handlebars', exphbs({
    defaultLayout: '',
}));
app.set('view engine', 'handlebars');
app.set('views', path.resolve(__dirname, '../../views'));

app.use(express.static(path.resolve(__dirname, '../../public')));

app.get('/', services);

export default app;
