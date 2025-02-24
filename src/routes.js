import express from 'express';
import { getDatabase } from './lib/db.client.js';

export const router = express.Router();

// 🔹 1. Render the form with categories
router.get('/form', async (_req, res) => {
  try {
    const db = getDatabase();
    console.log('✅ Database object:', db); // Check if database is connected

    const result = await db?.query('SELECT id, name FROM categories');
    console.log('📌 Fetched categories:', result?.rows); // Log fetched categories

    const categories = result?.rows ?? [];
    res.render('form', { title: 'Búa til spurningu', categories });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).send('Error loading form');
  }
});
router.post('/submit-answers', async (req, res) => {
  const db = getDatabase();
  const userAnswers = req.body; // Notandinn valdi þessi svör

  console.log("📥 Incoming POST request to /submit-answers");
  console.log("📌 User answers received:", userAnswers);

  try {
      // Sækja öll rétt svör úr gagnagrunninum
      const correctAnswersResult = await db?.query('SELECT id FROM answers WHERE is_correct = true');
      const correctAnswers = correctAnswersResult?.rows.map(row => row.id) ?? [];

      console.log("✅ Correct answers:", correctAnswers);

      // Athuga hvaða svör notandinn valdi eru rétt eða röng
      let results = {};
      for (let key in userAnswers) {
          results[userAnswers[key]] = correctAnswers.includes(parseInt(userAnswers[key])) ? 'correct' : 'incorrect';
      }

      console.log("🔍 Answer results:", results);

      // Skila JSON svörum svo hægt sé að uppfæra lit í JavaScript
      res.json(results);
  } catch (error) {
      console.error('❌ Error checking answers:', error);
      res.status(500).json({ error: 'Villa við að athuga svör' });
  }
});


router.get('/spurningar/:category_id', async (req, res) => {
  const { category_id } = req.params;
  const db = getDatabase();

  try {
      console.log(`🔍 Fetching category with ID: ${category_id}`);

      // Sækja flokkinn
      const categoryResult = await db?.query('SELECT * FROM categories WHERE id = $1', [category_id]);
      const category = categoryResult?.rows[0];

      if (!category) {
          return res.status(404).send('⚠️ Flokkur fannst ekki.');
      }

      console.log(`✅ Found category: ${category.name}`);

      // Sækja allar spurningar fyrir þennan flokk
      const questionsResult = await db?.query('SELECT * FROM questions WHERE category_id = $1', [category_id]);
      const questions = questionsResult?.rows ?? [];

      // Sækja svör fyrir hverja spurningu
      const answersResult = await db?.query('SELECT * FROM answers WHERE question_id IN (SELECT id FROM questions WHERE category_id = $1)', [category_id]);
      const answers = answersResult?.rows ?? [];

      // Tengja svör við réttar spurningar
      const questionsWithAnswers = questions.map(question => ({
          ...question,
          answers: answers.filter(answer => answer.question_id === question.id)
      }));

      console.log(`📌 Found ${questionsWithAnswers.length} questions for category ${category.name}`);

      res.render('questions', { title: `Spurningar um ${category.name}`, category, questions: questionsWithAnswers });
  } catch (error) {
      console.error('❌ Villa við að sækja spurningar:', error);
      res.status(500).send('Villa við að hlaða inn spurningum.');
  }
});


router.get('/', async (_req, res) => {
  try {
      const db = getDatabase();
      const result = await db?.query('SELECT * FROM categories');
      const categories = result?.rows ?? [];

      res.render('index', { title: 'Forsíða', categories });
  } catch (error) {
      console.error('❌ Error fetching categories:', error);
      res.status(500).send('Villa við að hlaða inn forsíðu');
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
