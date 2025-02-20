import express from 'express';
import router from './routes.js'; // Athuga að leiðin sé rétt
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const app = express();

app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const viewsPath = join(__dirname, 'views');

app.set('views', viewsPath);
app.set('view engine', 'ejs');

app.use('/', router);

// 404 síða
app.use((req, res) => {
  res.status(404).render('error', { message: 'Síða fannst ekki' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
