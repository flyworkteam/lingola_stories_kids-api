const { pool } = require('../config/database');

exports.saveWord = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { word, translation, source_language = 'en', target_language = 'tr' } = req.body;

    if (!word) {
      const error = new Error('Word is required');
      error.statusCode = 400;
      throw error;
    }

    // Check if word already exists for this user
    const checkQuery = `SELECT id FROM library WHERE user_id = ? AND word = ? LIMIT 1`;
    const [existing] = await pool.query(checkQuery, [userId, word]);

    if (existing.length > 0) {
      return res.status(200).json({ success: true, message: 'Word already saved', data: existing[0] });
    }

    const query = `
            INSERT INTO library (user_id, word, translation, source_language, target_language)
            VALUES (?, ?, ?, ?, ?)
        `;
    const [result] = await pool.query(query, [userId, word, translation, source_language, target_language]);

    res.status(201).json({
      success: true,
      message: 'Word saved successfully',
      data: { id: result.insertId, word, translation, source_language, target_language }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserLibrary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search = '', limit = 20, offset = 0 } = req.query;

    let query = `SELECT * FROM library WHERE user_id = ?`;
    const params = [userId];

    if (search) {
      query += ` AND word LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(query, params);

    // Let's also get the total count for pagination metadata
    let countQuery = `SELECT COUNT(*) as total FROM library WHERE user_id = ?`;
    const countParams = [userId];
    if (search) {
      countQuery += ` AND word LIKE ?`;
      countParams.push(`%${search}%`);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      total_words: total,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

exports.getPopularWords = async (req, res, next) => {
  try {
    // Group by word, order by frequency of saves across all users
    const query = `
            SELECT word, translation, COUNT(*) as save_count
            FROM library
            GROUP BY word, translation
            ORDER BY save_count DESC
            LIMIT 10
        `;
    const [rows] = await pool.query(query);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

exports.deleteWord = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const query = `DELETE FROM library WHERE id = ? AND user_id = ?`;
    const [result] = await pool.query(query, [id, userId]);

    if (result.affectedRows === 0) {
      const error = new Error('Word not found or not authorized to delete');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, message: 'Word removed from library' });
  } catch (error) {
    next(error);
  }
};
