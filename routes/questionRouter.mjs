import connectionPool from "../utils/db.mjs";
import { Router } from "express";

const questionRouter = Router();

questionRouter.post("/", async (req, res) => {
  try {
    const newQuestion = { ...req.body};
    const result = await connectionPool.query(
      `INSERT INTO questions (title, description, category) VALUES ($1,$2,$3) RETURNING id`,
      [
        newQuestion.title,
        newQuestion.description,
        newQuestion.category,
      ]
    );

    const newQuestionId = result.rows[0].id;
    return res.status(201).json({
      message: `Question id: ${newQuestionId} has been created successfully`,
    });
  } catch (error) {
    console.error("Database error:", error); 
    return res.status(500).json({
      message: `Server could not create post due to a database error`,
      error: error.message, 
    });
  }
});

export default questionRouter;
