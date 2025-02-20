import express from 'express';
import router from './routes.js';
import dotenv from 'dotenv';
import helmet from 'helmet';

dotenv.config();

console.log('DB URL:', process.env.DATABASE_URL);


const app = express();

const viewsPath = 'views';

app.set('views', viewsPath);
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.disable('x-powered-by');
app.use('/', router);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});