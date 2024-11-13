import connectionPool from "../utils/db.mjs";
import { Router } from "express";

const answerRouter = Router();

//vote on answer
answerRouter.post("/:answerId/vote", async (req, res) => {
  try {
    const answerIdFromClient = req.params.answerId;
    const { vote } = req.body;
    const createVote = { ...req.body };

    if (vote !== 1 && vote !== -1) {
      return res.status(400).json({
        message: "Invalid vote value.",
      });
    }

    const answerCheck = await connectionPool.query(
      `SELECT id FROM answers WHERE id = $1`,
      [answerIdFromClient]
    );

    if (answerCheck.rowCount === 0) {
      return res.status(404).json({
        message: "Answer not found.",
      });
    }

    await connectionPool.query(
      `UPDATE answer_votes SET vote = $1 WHERE answer_id = $2 RETURNING *`,
      [createVote.vote, answerIdFromClient]
    );

    return res.status(200).json({
      message: "Vote on the answer has been recorded successfully.",
    });
  } catch {
    return res.status(500).json({
      message: "Unable to vote answer.",
    });
  }
});

export default answerRouter;
