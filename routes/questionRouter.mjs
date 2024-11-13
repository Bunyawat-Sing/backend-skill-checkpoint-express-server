import connectionPool from "../utils/db.mjs";
import { Router } from "express";

const questionRouter = Router();

//search question by title or category
questionRouter.get("/search", async (req, res) => {
  try {
    let query = `SELECT id, title, description, category FROM questions `;
    let values = [];
    const category = req.query.category || "";
    const title = req.query.title || "";

    if (title && category) {
      query += ` WHERE category ILIKE $1 AND title ILIKE $2`;
      values = [`%${category}%`, `%${title}%`];
    } else if (category) {
      query += ` WHERE category ILIKE $1`;
      values = [`%${category}%`];
    } else if (title) {
      query += ` WHERE title ILIKE $1`;
      values = [`%${title}%`];
    }

    const result = await connectionPool.query(query, values);

    if (!category && !title) {
      return res.status(400).json({
        message: "Invalid search parameters.",
      });
    }

    return res.status(200).json({
      data: result.rows,
    });
  } catch {
    return res.status(500).json({
      message: "Unable to fetch questions.",
    });
  }
});

//create answer for a specific question
questionRouter.post("/:questionId/answers", async (req, res) => {
  try {
    const questionIdFromClient = req.params.questionId;
    const createAnswer = { ...req.body };

    const questionCheck = await connectionPool.query(
      `SELECT id FROM questions WHERE id = $1`,
      [questionIdFromClient]
    );

    if (questionCheck.rowCount === 0) {
      return res.status(404).json({
        message: "Question not found.",
      });
    }

    await connectionPool.query(
      `INSERT INTO answers (question_id, content) VALUES ($1, $2)`,
      [questionIdFromClient, createAnswer.content]
    );

    return res.status(201).json({
      message: "Answer created successfully.",
    });
  } catch {
    return res.status(500).json({
      message: "Unable to create an answer.",
    });
  }
});

//read answer for a specific question
questionRouter.get("/:questionId/answers", async (req, res) => {
  try {
    const questionIdFromClient = req.params.questionId;

    const questionCheck = await connectionPool.query(
      `SELECT id FROM questions WHERE id = $1`,
      [questionIdFromClient]
    );

    if (questionCheck.rowCount === 0) {
      return res.status(404).json({
        message: "Question not found.",
      });
    }

    const result = await connectionPool.query(
      `SELECT id, content FROM answers WHERE question_id = $1`,
      [questionIdFromClient]
    );

    return res.status(200).json({
      data: result.rows,
    });
  } catch {
    return res.status(500).json({
      message: "Unable to fetch answers.",
    });
  }
});

//delete answer
questionRouter.delete("/:questionId/answers", async (req, res) => {
  try {
    const questionIdFromClient = req.params.questionId;

    const questionCheck = await connectionPool.query(
      `SELECT id FROM questions WHERE id = $1`,
      [questionIdFromClient]
    );

    if (questionCheck.rowCount === 0) {
      return res.status(404).json({
        message: "Question not found.",
      });
    }

    await connectionPool.query(`DELETE FROM answers WHERE question_id = $1`, [
      questionIdFromClient,
    ]);

    return res.status(200).json({
      message: "All answers for the question have been deleted successfully.",
    });
  } catch {
    return res.status(500).json({
      message: "Unable to delete answers.",
    });
  }
});

//vote on question
questionRouter.post("/:questionId/vote", async (req, res) => {
  try {
    const questionIdFromClient = req.params.questionId;
    const { vote } = req.body;
    const createVote = { ...req.body };

    if (vote !== 1 && vote !== -1) {
      return res.status(400).json({
        message: "Invalid vote value.",
      });
    }

    const questionCheck = await connectionPool.query(
      `SELECT id FROM questions WHERE id = $1`,
      [questionIdFromClient]
    );

    if (questionCheck.rowCount === 0) {
      return res.status(404).json({
        message: "Question not found.",
      });
    }

    await connectionPool.query(
      `UPDATE question_votes SET vote = $1 WHERE question_id = $2 RETURNING *`,
      [createVote.vote, questionIdFromClient]
    );

    return res.status(200).json({
      message: "Vote on the question has been recorded successfully.",
    });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({
      message: "Unable to vote question.",
      error: error.message,
    });
  }
});

//create question
questionRouter.post("/", async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const newQuestion = { ...req.body };

    await connectionPool.query(
      `INSERT INTO questions (title, description, category) VALUES ($1,$2,$3)`,
      [newQuestion.title, newQuestion.description, newQuestion.category]
    );

    if (!title || !description || !category) {
      return res.status(400).json({
        message: "Invalid request data.",
      });
    }

    return res.status(201).json({
      message: `Question created successfully.`,
    });
  } catch {
    return res.status(500).json({
      message: `Unable to create question.`,
    });
  }
});

//read all question
questionRouter.get("/", async (req, res) => {
  try {
    const result = await connectionPool.query(
      `SELECT id, title, description, category FROM questions`
    );

    return res.status(200).json({ data: result.rows });
  } catch {
    return res.status(500).json({
      message: `Unable to fetch questions.`,
    });
  }
});

//read question by id
questionRouter.get("/:questionId", async (req, res) => {
  try {
    const questionIdFromClient = req.params.questionId;
    const result = await connectionPool.query(
      `SELECT id, title, description, category FROM questions WHERE id = $1`,
      [questionIdFromClient]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        message: `Question not found.`,
      });
    }

    return res.status(200).json({ data: result.rows });
  } catch {
    return res.status(500).json({
      message: `Unable to fetch questions.`,
    });
  }
});

//update question by id
questionRouter.put("/:questionId", async (req, res) => {
  try {
    const questionIdFromClient = req.params.questionId;
    const { title, description, category } = req.body;
    const updatedQuestion = { ...req.body };
    const result = await connectionPool.query(
      `UPDATE questions SET title = $2, description = $3, category = $4 WHERE id = $1`,
      [
        questionIdFromClient,
        updatedQuestion.title,
        updatedQuestion.description,
        updatedQuestion.category,
      ]
    );

    if (!title || !description || !category) {
      return res.status(400).json({
        message: "Invalid request data.",
      });
    }

    if (!result.rowCount) {
      return res.status(404).json({
        message: `Question not found.`,
      });
    }

    return res.status(200).json({ message: "Question updated successfully." });
  } catch {
    return res.status(500).json({
      message: `Unable to fetch questions.`,
    });
  }
});

//delete question
questionRouter.delete("/:questionId", async (req, res) => {
  try {
    const questionIdFromClient = req.params.questionId;

    const result = await connectionPool.query(
      `DELETE FROM questions WHERE id = $1`,
      [questionIdFromClient]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: `Question not found.`,
      });
    }

    return res.status(200).json({
      message: "Question post has been deleted successfully.",
    });
  } catch {
    return res.status(500).json({
      message: "Unable to delete question.",
    });
  }
});

export default questionRouter;
