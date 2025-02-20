import express from 'express';
import pool from './lib/db.client.js';

const router = express.Router();

// Forsíða – birta alla flokka
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories');
    res.render('index', { categories: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Villa við að sækja gögn' });
  }
});

// Flokkasíða – birta allar spurningar í flokki
router.get('/category/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const category = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    const questions = await pool.query('SELECT * FROM questions WHERE category_id = $1', [id]);

    if (category.rows.length === 0) {
      return res.status(404).render('error', { message: 'Flokkur fannst ekki' });
    }

    res.render('category', { category: category.rows[0], questions: questions.rows });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Villa við að sækja gögn' });
  }
});

// Síða til að bæta við spurningu
router.get('/add-question', async (req, res) => {
  try {
    const categories = await pool.query('SELECT * FROM categories');
    res.render('form', { categories: categories.rows });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Villa við að sækja gögn' });
  }
});

// Vinna úr formi og bæta við spurningu
router.post('/add-question', async (req, res) => {
  const { question, category_id, answers } = req.body;
  try {
    const newQuestion = await pool.query(
      'INSERT INTO questions (question, category_id) VALUES ($1, $2) RETURNING id',
      [question, category_id]
    );

    const questionId = newQuestion.rows[0].id;

    // Setja inn svör (þarf að klára)
    for (let answer of answers) {
      await pool.query(
        'INSERT INTO answers (question_id, answer, is_correct) VALUES ($1, $2, $3)',
        [questionId, answer.text, answer.is_correct]
      );
    }

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Villa við að bæta við spurningu' });
  }
});

export default router;
