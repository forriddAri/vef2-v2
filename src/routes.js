import express from 'express';
import { getDatabase } from './lib/db.client.js';

export const router = express.Router();

// 🔹 1. Render the form with categories
router.get('/form', async (req, res) => {
  try {
    const db = getDatabase();
    const result = await db?.query('SELECT id, name FROM categories');
    const categories = result?.rows ?? [];

    res.render('form', { title: 'Búa til spurningu', categories });
  } catch (error) {
    console.error('Villa við að sækja flokka:', error);
    res.status(500).send('Villa við að hlaða inn formi');
  }
});

// 🔹 2. Handle form submission (insert question + answers)
router.post('/questions', async (req, res) => {
  const { category_id, question, answer1, answer2, answer3, correct_answer } = req.body;

  if (!category_id || !question || !answer1 || !answer2 || !answer3 || !correct_answer) {
    return res.status(400).send('Öll svæði eru nauðsynleg.');
  }

  try {
    const db = getDatabase();

    // 🔹 Insert the question and get the generated ID
    const questionResult = await db?.query(
      'INSERT INTO questions (category_id, question) VALUES ($1, $2) RETURNING id',
      [category_id, question]
    );

    const questionId = questionResult?.rows[0]?.id;
    if (!questionId) throw new Error('Ekki tókst að vista spurningu');

    // 🔹 Insert the answers
    const answers = [
      { text: answer1, is_correct: correct_answer === "1" },
      { text: answer2, is_correct: correct_answer === "2" },
      { text: answer3, is_correct: correct_answer === "3" }
    ];

    for (const answer of answers) {
      await db?.query(
        'INSERT INTO answers (question_id, answer, is_correct) VALUES ($1, $2, $3)',
        [questionId, answer.text, answer.is_correct]
      );
    }

    res.redirect('/form-created');
  } catch (error) {
    console.error('Villa við að vista spurningu:', error);
    res.status(500).send('Villa við að vista spurningu');
  }
});
