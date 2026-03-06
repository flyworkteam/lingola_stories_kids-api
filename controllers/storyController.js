const { pool } = require('../config/database');

const mapStory = (row) => ({
  id: row.id,
  title: row.title,
  introduction: row.introduction,
  cover_image_url: row.cover_image_url,
  rating: parseFloat(row.rating),
  read_count: row.read_count,
  rating_count: row.rating_count,
  total_pages: row.total_pages,
  is_popular: Boolean(row.is_popular),
  categories: row.categories ? row.categories.split(',') : [],
  tags: row.tags ? row.tags.split(',') : []
});

exports.getContinueReading = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const query = `
            SELECT s.*, us.current_page, us.audio_position, us.is_completed, 
                   (SELECT GROUP_CONCAT(category_name) FROM story_categories WHERE story_id = s.id) as categories,
                   (SELECT GROUP_CONCAT(tag_name) FROM story_tags WHERE story_id = s.id) as tags
            FROM user_stories us
            JOIN stories s ON us.story_id = s.id
            WHERE us.user_id = ? AND us.is_completed = 0
            ORDER BY us.last_read_at DESC
            LIMIT 1
        `;
    const [rows] = await pool.query(query, [userId]);

    if (rows.length === 0) {
      return res.status(200).json({ success: true, data: null });
    }

    const data = mapStory(rows[0]);
    data.progress = {
      current_page: rows[0].current_page,
      audio_position: parseFloat(rows[0].audio_position),
      is_completed: Boolean(rows[0].is_completed)
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getReadingHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const query = `
            SELECT s.*,
                   (SELECT GROUP_CONCAT(category_name) FROM story_categories WHERE story_id = s.id) as categories,
                   (SELECT GROUP_CONCAT(tag_name) FROM story_tags WHERE story_id = s.id) as tags
            FROM user_stories us
            JOIN stories s ON us.story_id = s.id
            WHERE us.user_id = ?
            ORDER BY us.last_read_at DESC
            LIMIT 10
        `;
    const [rows] = await pool.query(query, [userId]);
    res.status(200).json({ success: true, data: rows.map(mapStory) });
  } catch (error) {
    next(error);
  }
};

exports.getRecommended = async (req, res, next) => {
  try {
    const query = `
            SELECT s.*, 
                   (SELECT GROUP_CONCAT(category_name) FROM story_categories WHERE story_id = s.id) as categories,
                   (SELECT GROUP_CONCAT(tag_name) FROM story_tags WHERE story_id = s.id) as tags
            FROM stories s
            ORDER BY s.is_popular DESC, s.rating DESC, s.read_count DESC
            LIMIT 10
        `;
    const [rows] = await pool.query(query);
    res.status(200).json({ success: true, data: rows.map(mapStory) });
  } catch (error) {
    next(error);
  }
};

exports.getAllStories = async (req, res, next) => {
  try {
    const { category, is_popular, limit = 20, offset = 0 } = req.query;
    let query = `
            SELECT s.*, 
                   (SELECT GROUP_CONCAT(category_name) FROM story_categories WHERE story_id = s.id) as categories,
                   (SELECT GROUP_CONCAT(tag_name) FROM story_tags WHERE story_id = s.id) as tags
            FROM stories s
        `;
    const params = [];
    const whereClauses = [];

    if (category) {
      query += " JOIN story_categories filter_c ON s.id = filter_c.story_id";
      whereClauses.push("filter_c.category_name = ?");
      params.push(category);
    }

    if (is_popular === 'true' || is_popular === '1') {
      whereClauses.push("s.is_popular = 1");
    }

    if (whereClauses.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    }

    query += " GROUP BY s.id ORDER BY s.id DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.query(query, params);
    res.status(200).json({ success: true, data: rows.map(mapStory) });
  } catch (error) {
    next(error);
  }
};

exports.getStoryDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = `
            SELECT s.*, 
                   (SELECT GROUP_CONCAT(category_name) FROM story_categories WHERE story_id = s.id) as categories,
                   (SELECT GROUP_CONCAT(tag_name) FROM story_tags WHERE story_id = s.id) as tags
            FROM stories s
            WHERE s.id = ?
        `;
    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      const error = new Error('Story not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, data: mapStory(rows[0]) });
  } catch (error) {
    next(error);
  }
};

exports.getStorySections = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = `
            SELECT id, story_id, title, content, page_number, 
                   elevenlabs_audio_url, elevenlabs_voice_id, audio_duration, word_timestamps
            FROM story_sections 
            WHERE story_id = ?
            ORDER BY page_number ASC
        `;
    const [rows] = await pool.query(query, [id]);

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

exports.getStoryProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const query = `
            SELECT current_page, audio_position, is_completed 
            FROM user_stories 
            WHERE user_id = ? AND story_id = ?
        `;
    const [rows] = await pool.query(query, [userId, id]);

    if (rows.length === 0) {
      return res.status(200).json({ success: true, data: null });
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateStoryProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { current_page, audio_position, is_completed } = req.body;

    if (current_page === undefined) {
      const error = new Error('current_page is required');
      error.statusCode = 400;
      throw error;
    }

    const isCompletedNum = is_completed ? 1 : 0;

    const query = `
            INSERT INTO user_stories (user_id, story_id, current_page, audio_position, is_completed)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                current_page = VALUES(current_page),
                audio_position = VALUES(audio_position),
                is_completed = GREATEST(is_completed, VALUES(is_completed)),
                last_read_at = CURRENT_TIMESTAMP
        `;

    await pool.query(query, [
      userId, id, current_page,
      audio_position || 0,
      isCompletedNum
    ]);

    // Optionally update read_count if newly completed
    if (isCompletedNum) {
      // Check if we need to manually update, but for now we can just increment.
      // Ideally should be idempotent (only once per user per story), but let's assume valid.
      // A more robust way: ignore if already completed. The GREATEST above handles the flag locally.
    }

    res.status(200).json({ success: true, message: 'Progress updated' });
  } catch (error) {
    next(error);
  }
};

exports.rateStory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      const error = new Error('Rating must be between 1 and 5');
      error.statusCode = 400;
      throw error;
    }

    // Upsert the user's rating
    const userRatingQuery = `
            INSERT INTO user_story_ratings (user_id, story_id, rating)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE rating = VALUES(rating)
        `;
    await pool.query(userRatingQuery, [userId, id, rating]);

    // Recalculate and update the overall rating for the story
    const recalcQuery = `
            UPDATE stories 
            SET 
                rating_count = (SELECT COUNT(*) FROM user_story_ratings WHERE story_id = ?),
                rating = (SELECT AVG(rating) FROM user_story_ratings WHERE story_id = ?)
            WHERE id = ?
        `;
    await pool.query(recalcQuery, [id, id, id]);

    res.status(200).json({ success: true, message: 'Rating saved successfully' });
  } catch (error) {
    next(error);
  }
};
