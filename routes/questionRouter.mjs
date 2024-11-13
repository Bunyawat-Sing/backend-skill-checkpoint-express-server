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
