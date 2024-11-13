import connectionPool from "../utils/db.mjs";
import { Router } from "express";

const questionRouter = Router();

questionRouter.post("/", async (req, res) => {
  try {
    const newQuestion = { ...req.body, created_at: new Date() };
    const result = await connectionPool.query(
      `INSERT INTO questions (question_id, title, description, category, created_at) VALUES ($1,$2,$3,$4) RETURNING id`,
      [
        newQuestion.title,
        newQuestion.description,
        newQuestion.category,
        newQuestion.created_at,
      ]
    );

    const newQuestionId = result.rows[0].id;
    res.status(201).json({
      message: `Question id: ${newQuestionId} has been created successfully`,
    });
  } catch {
    return res.status(500).json({
      message: `Server could not create post because database connection`,
    });
  }
});
