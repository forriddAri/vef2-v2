import { getDatabase } from '../lib/db.client.js';

async function seedDatabase() {
    const db = getDatabase();

    try {
        console.log("🌱 Checking if categories exist...");

        // Check if categories exist
        const categoryCheck = await db?.query('SELECT COUNT(*) FROM categories');
        if (categoryCheck?.rows[0].count === "0") {
            console.log("⚠️ No categories found. Inserting default categories...");
            await db?.query(`
                INSERT INTO categories (name) VALUES 
                ('HTML'), ('CSS'), ('JavaScript');
            `);
        } else {
            console.log("✅ Categories already exist.");
        }

        console.log("🌱 Checking if questions exist...");
        // Check if questions exist
        const questionCheck = await db?.query('SELECT COUNT(*) FROM questions');
        if (questionCheck?.rows[0].count === "0") {
            console.log("⚠️ No questions found. Inserting default questions...");
            await db?.query(`
                INSERT INTO questions (category_id, question) VALUES 
                (1, 'What does HTML stand for?'),
                (2, 'What property is used to change text color in CSS?'),
                (3, 'Which keyword is used to declare a variable in JavaScript?');
            `);

            console.log("✅ Default questions inserted.");
        } else {
            console.log("✅ Questions already exist.");
        }

        console.log("🌱 Database seeding completed successfully.");
    } catch (error) {
        console.error("❌ Error seeding database:", error);
    }
}

// Run the function when script is executed
seedDatabase();
