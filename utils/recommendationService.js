const { pool } = require('../config/database');

/**
 * Exercise Recommendation Service
 * Rule-based recommendation system that matches exercises to user profiles
 */

/**
 * Get recommended exercises for a user based on their profile
 * @param {number} userId - User ID
 * @param {object} options - Options for recommendations
 * @param {string} options.lang - Language code (default: 'en')
 * @param {number} options.limit - Maximum number of exercises to return (default: 10, max: 50)
 * @param {number} options.minScore - Minimum score to include exercise (default: 0)
 * @param {boolean} options.excludeFavorites - Exclude already favorited exercises (default: false)
 * @returns {Promise<Array>} Array of recommended exercises with scores
 */
const getRecommendedExercises = async (userId, options = {}) => {
  const {
    lang = 'en',
    limit = 10,
    minScore = 0,
    excludeFavorites = false
  } = options;

  // Validate limit
  const validLimit = Math.min(Math.max(1, limit), 50);

  try {
    // Step 1: Fetch user profile data
    const [userProfile] = await pool.execute(
      `SELECT 
        skin_type,
        target_face_shape
      FROM user_profiles
      WHERE user_id = ?`,
      [userId]
    );

    // Step 2: Fetch user improvement areas
    const [improvementAreas] = await pool.execute(
      `SELECT area FROM user_improvement_areas WHERE user_id = ?`,
      [userId]
    );

    // Step 3: Fetch user objectives
    const [objectives] = await pool.execute(
      `SELECT objective FROM user_objectives WHERE user_id = ?`,
      [userId]
    );

    // Step 4: Fetch user skin concerns
    const [skinConcerns] = await pool.execute(
      `SELECT concern FROM user_skin_concerns WHERE user_id = ?`,
      [userId]
    );

    // If user has no profile data, return empty array
    if (userProfile.length === 0 && improvementAreas.length === 0 && 
        objectives.length === 0 && skinConcerns.length === 0) {
      return [];
    }

    // Extract user data
    const profile = userProfile[0] || {};
    const userAreas = improvementAreas.map(row => row.area);
    const userObjectives = objectives.map(row => row.objective);
    const userConcerns = skinConcerns.map(row => row.concern);
    const userSkinType = profile.skin_type;
    const userFaceShape = profile.target_face_shape;

    // Step 5: Build the query to get exercises with all metadata
    // We'll use LEFT JOINs to get all metadata and then calculate scores in JavaScript
    const excludeFavoritesClause = excludeFavorites 
      ? `AND uf.id IS NULL` 
      : '';

    const [exercises] = await pool.execute(
      `SELECT 
        e.id,
        e.slug,
        e.type,
        e.duration_minutes,
        e.image_cdn_path,
        e.video_cdn_path,
        e.is_active,
        et.language_code,
        et.title,
        et.description,
        et.benefits,
        GROUP_CONCAT(DISTINCT eta.area) as target_areas,
        GROUP_CONCAT(DISTINCT eo.objective) as objectives,
        GROUP_CONCAT(DISTINCT esc.concern) as concerns,
        GROUP_CONCAT(DISTINCT efs.face_shape) as face_shapes,
        GROUP_CONCAT(DISTINCT est.skin_type) as skin_types,
        CASE WHEN uf.id IS NOT NULL THEN 1 ELSE 0 END as is_favorited
      FROM exercises e
      LEFT JOIN exercise_translations et ON e.id = et.exercise_id AND et.language_code = ?
      LEFT JOIN exercise_target_areas eta ON e.id = eta.exercise_id
      LEFT JOIN exercise_objectives eo ON e.id = eo.exercise_id
      LEFT JOIN exercise_skin_concerns esc ON e.id = esc.exercise_id
      LEFT JOIN exercise_face_shapes efs ON e.id = efs.exercise_id
      LEFT JOIN exercise_skin_types est ON e.id = est.exercise_id
      LEFT JOIN user_favorites uf ON e.id = uf.exercise_id AND uf.user_id = ?
      WHERE e.is_active = 1 ${excludeFavoritesClause}
      GROUP BY e.id, et.language_code, et.title, et.description, et.benefits, uf.id
      ORDER BY e.id ASC`,
      [lang, userId]
    );

    // Step 6: Calculate scores for each exercise
    const scoredExercises = exercises.map(exercise => {
      let score = 0;
      const matchedCategories = [];

      // Parse comma-separated metadata values
      const exerciseAreas = exercise.target_areas ? exercise.target_areas.split(',') : [];
      const exerciseObjectives = exercise.objectives ? exercise.objectives.split(',') : [];
      const exerciseConcerns = exercise.concerns ? exercise.concerns.split(',') : [];
      const exerciseFaceShapes = exercise.face_shapes ? exercise.face_shapes.split(',') : [];
      const exerciseSkinTypes = exercise.skin_types ? exercise.skin_types.split(',') : [];

      // Scoring logic (priority based on importance)
      
      // 1. Skin concerns - Highest priority (10 points each)
      userConcerns.forEach(concern => {
        if (exerciseConcerns.includes(concern)) {
          score += 10;
          matchedCategories.push(concern);
        }
      });

      // 2. Improvement areas - High priority (7 points each)
      userAreas.forEach(area => {
        if (exerciseAreas.includes(area)) {
          score += 7;
          matchedCategories.push(area);
        }
      });

      // 3. Objectives - Medium priority (5 points each)
      userObjectives.forEach(objective => {
        if (exerciseObjectives.includes(objective)) {
          score += 5;
          matchedCategories.push(objective);
        }
      });

      // 4. Target face shape - Lower priority (3 points)
      if (userFaceShape && exerciseFaceShapes.includes(userFaceShape)) {
        score += 3;
        matchedCategories.push(userFaceShape);
      }

      // 5. Skin type - Lowest priority (2 points)
      if (userSkinType && exerciseSkinTypes.includes(userSkinType)) {
        score += 2;
        matchedCategories.push(userSkinType);
      }

      return {
        id: exercise.id,
        slug: exercise.slug,
        type: exercise.type,
        durationMinutes: exercise.duration_minutes,
        imageCdnPath: exercise.image_cdn_path,
        videoCdnPath: exercise.video_cdn_path,
        title: exercise.title,
        description: exercise.description,
        benefits: exercise.benefits,
        isFavorited: !!exercise.is_favorited,
        recommendationScore: score,
        matchedCategories: [...new Set(matchedCategories)] // Remove duplicates
      };
    });

    // Step 7: Filter by minimum score and sort by score (descending)
    const filteredExercises = scoredExercises
      .filter(ex => ex.recommendationScore >= minScore)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, validLimit);

    return filteredExercises;

  } catch (error) {
    console.error('Error in getRecommendedExercises:', error);
    throw error;
  }
};

module.exports = {
  getRecommendedExercises
};
