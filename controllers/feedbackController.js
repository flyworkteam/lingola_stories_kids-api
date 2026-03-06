const { pool } = require('../config/database');

exports.submitFeedback = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subject, message } = req.body;

    if (!subject || !message) {
      const error = new Error('Subject and message are required');
      error.statusCode = 400;
      throw error;
    }

    const query = `
            INSERT INTO feedback (user_id, subject, message)
            VALUES (?, ?, ?)
        `;
    const [result] = await pool.query(query, [userId, subject, message]);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { id: result.insertId, subject, message }
    });
  } catch (error) {
    next(error);
  }
};
