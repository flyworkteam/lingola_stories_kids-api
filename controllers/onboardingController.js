const { pool } = require("../config/database");

/**
 * Save/Update basic information (Step 1)
 * POST /api/onboarding/basic-info
 */
const saveBasicInfo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { full_name, gender, age } = req.body;

    // Update user's full name
    if (full_name) {
      await pool.execute("UPDATE users SET full_name = ? WHERE id = ?", [
        full_name,
        userId,
      ]);
    }

    // Insert or update profile
    const [existing] = await pool.execute(
      "SELECT id FROM user_profiles WHERE user_id = ?",
      [userId],
    );

    if (existing.length > 0) {
      // Update existing profile
      await pool.execute(
        "UPDATE user_profiles SET gender = ?, age = ? WHERE user_id = ?",
        [gender, age, userId],
      );
    } else {
      // Create new profile
      await pool.execute(
        "INSERT INTO user_profiles (user_id, gender, age) VALUES (?, ?, ?)",
        [userId, gender, age],
      );
    }

    res.json({
      success: true,
      message: "Basic information saved successfully",
    });
  } catch (error) {
    console.error("[saveBasicInfo] Error saving basic information:", error);

    // Add context to help with debugging
    error.context = {
      operation: "saveBasicInfo",
      reason: "Failed to save basic user information (name, gender, age)",
      suggestion:
        "This could be due to missing user profile or database constraint issues. Ensure the user exists and data is valid.",
    };

    next(error);
  }
};

/**
 * Save physical information (weight, height)
 * POST /api/onboarding/physical-info
 */
const savePhysicalInfo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { weight, height } = req.body;

    await pool.execute(
      "UPDATE user_profiles SET weight = ?, height = ? WHERE user_id = ?",
      [weight, height, userId],
    );

    res.json({
      success: true,
      message: "Physical information saved successfully",
    });
  } catch (error) {
    console.error(
      "[savePhysicalInfo] Error saving physical information:",
      error,
    );

    // Check if it's an UPDATE with no affected rows
    if (error.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User Profile Not Found",
        error: {
          type: "PROFILE_NOT_FOUND",
          reason:
            "Cannot save physical information because user profile does not exist.",
          suggestion:
            "Please complete basic information (gender, age) first before adding physical information.",
          action:
            "Call POST /api/onboarding/basic-info to create the profile first.",
        },
      });
    }

    error.context = {
      operation: "savePhysicalInfo",
      reason: "Failed to save physical information (weight, height)",
      suggestion:
        "User profile may not exist. Complete basic-info endpoint first.",
    };

    next(error);
  }
};

/**
 * Save skin concerns (multiple selection)
 * POST /api/onboarding/skin-concerns
 */
const saveSkinConcerns = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const { concerns } = req.body; // Array of concerns

    // Delete existing concerns
    await connection.execute(
      "DELETE FROM user_skin_concerns WHERE user_id = ?",
      [userId],
    );

    // Insert new concerns
    if (concerns && concerns.length > 0) {
      const values = concerns.map((concern) => [userId, concern]);
      const placeholders = values.map(() => "(?, ?)").join(", ");
      const flatValues = values.flat();

      await connection.execute(
        `INSERT INTO user_skin_concerns (user_id, concern) VALUES ${placeholders}`,
        flatValues,
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Skin concerns saved successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("[saveSkinConcerns] Error saving skin concerns:", error);

    error.context = {
      operation: "saveSkinConcerns",
      reason: "Failed to save skin concerns in a database transaction",
      details: {
        concerns: req.body.concerns,
        transactionStage:
          "Either DELETE old concerns or INSERT new concerns failed",
      },
      suggestion:
        "This usually happens if the user_id is invalid or if the concerns array contains invalid data.",
      action:
        "Verify that concerns array contains only valid values: acne, redness, swelling, wrinkles, neck_lines",
    };

    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Save skin type
 * POST /api/onboarding/skin-type
 */
const saveSkinType = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { skin_type } = req.body;

    await pool.execute(
      "UPDATE user_profiles SET skin_type = ? WHERE user_id = ?",
      [skin_type, userId],
    );

    res.json({
      success: true,
      message: "Skin type saved successfully",
    });
  } catch (error) {
    console.error("[saveSkinType] Error saving skin type:", error);

    error.context = {
      operation: "saveSkinType",
      reason: "Failed to save skin type to user profile",
      details: {
        receivedValue: req.body.skin_type,
        validOptions: ["normal", "oily", "dry", "combination", "sensitive"],
      },
      suggestion:
        "Ensure the skin_type value is one of the valid options and user profile exists.",
      action:
        "Check that basic-info was completed first to create the profile.",
    };

    next(error);
  }
};

/**
 * Save Botox history
 * POST /api/onboarding/botox
 */
const saveBotoxHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { has_botox } = req.body;

    await pool.execute(
      "UPDATE user_profiles SET has_botox = ? WHERE user_id = ?",
      [has_botox ? 1 : 0, userId],
    );

    res.json({
      success: true,
      message: "Botox history saved successfully",
    });
  } catch (error) {
    console.error("[saveBotoxHistory] Error saving Botox history:", error);

    error.context = {
      operation: "saveBotoxHistory",
      reason: "Failed to save Botox history to user profile",
      details: {
        receivedValue: req.body.has_botox,
        expectedType: "boolean (true/false)",
      },
      suggestion:
        "Ensure has_botox is a boolean value and user profile exists.",
      action: "Send true or false value for has_botox field.",
    };

    next(error);
  }
};

/**
 * Save target face shape
 * POST /api/onboarding/face-shape
 */
const saveFaceShape = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { target_face_shape } = req.body;

    await pool.execute(
      "UPDATE user_profiles SET target_face_shape = ? WHERE user_id = ?",
      [target_face_shape, userId],
    );

    res.json({
      success: true,
      message: "Target face shape saved successfully",
    });
  } catch (error) {
    console.error("[saveFaceShape] Error saving face shape:", error);

    error.context = {
      operation: "saveFaceShape",
      reason: "Failed to save target face shape to user profile",
      details: {
        receivedValue: req.body.target_face_shape,
        validOptions: ["heart", "oval", "square", "round", "diamond"],
      },
      suggestion:
        "Ensure the target_face_shape is one of the valid options and user profile exists.",
      action: "Choose one of: heart, oval, square, round, diamond",
    };

    next(error);
  }
};

/**
 * Save makeup frequency
 * POST /api/onboarding/makeup-frequency
 */
const saveMakeupFrequency = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { makeup_frequency } = req.body;

    await pool.execute(
      "UPDATE user_profiles SET makeup_frequency = ? WHERE user_id = ?",
      [makeup_frequency, userId],
    );

    res.json({
      success: true,
      message: "Makeup frequency saved successfully",
    });
  } catch (error) {
    console.error(
      "[saveMakeupFrequency] Error saving makeup frequency:",
      error,
    );

    error.context = {
      operation: "saveMakeupFrequency",
      reason: "Failed to save makeup frequency to user profile",
      details: {
        receivedValue: req.body.makeup_frequency,
        validOptions: ["every_day", "few_days_week", "occasionally", "never"],
      },
      suggestion: "Ensure the makeup_frequency is one of the valid options.",
      action: "Choose one of: every_day, few_days_week, occasionally, never",
    };

    next(error);
  }
};

/**
 * Save objectives (multiple selection)
 * POST /api/onboarding/objectives
 */
const saveObjectives = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const { objectives } = req.body; // Array of objectives

    // Delete existing objectives
    await connection.execute("DELETE FROM user_objectives WHERE user_id = ?", [
      userId,
    ]);

    // Insert new objectives
    if (objectives && objectives.length > 0) {
      const values = objectives.map((objective) => [userId, objective]);
      const placeholders = values.map(() => "(?, ?)").join(", ");
      const flatValues = values.flat();

      await connection.execute(
        `INSERT INTO user_objectives (user_id, objective) VALUES ${placeholders}`,
        flatValues,
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Objectives saved successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("[saveObjectives] Error saving objectives:", error);

    error.context = {
      operation: "saveObjectives",
      reason: "Failed to save user objectives in a database transaction",
      details: {
        objectives: req.body.objectives,
        validOptions: [
          "reduce_wrinkles",
          "tighten_skin",
          "lift_eyelids",
          "eliminate_double_chin",
          "brighten_tone",
          "all",
        ],
        transactionStage:
          "Either DELETE old objectives or INSERT new objectives failed",
      },
      suggestion:
        "Verify that objectives array contains only valid goal values.",
      action:
        "Check the objectives array for invalid values and ensure user exists.",
    };

    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Save improvement areas (multiple selection)
 * POST /api/onboarding/improvement-areas
 */
const saveImprovementAreas = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const { areas } = req.body; // Array of areas

    // Delete existing areas
    await connection.execute(
      "DELETE FROM user_improvement_areas WHERE user_id = ?",
      [userId],
    );

    // Insert new areas
    if (areas && areas.length > 0) {
      const values = areas.map((area) => [userId, area]);
      const placeholders = values.map(() => "(?, ?)").join(", ");
      const flatValues = values.flat();

      await connection.execute(
        `INSERT INTO user_improvement_areas (user_id, area) VALUES ${placeholders}`,
        flatValues,
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Improvement areas saved successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error(
      "[saveImprovementAreas] Error saving improvement areas:",
      error,
    );

    error.context = {
      operation: "saveImprovementAreas",
      reason: "Failed to save improvement areas in a database transaction",
      details: {
        areas: req.body.areas,
        validOptions: [
          "forehead",
          "eyes",
          "nose",
          "cheeks",
          "lips",
          "jawline",
          "neck",
        ],
        transactionStage: "Either DELETE old areas or INSERT new areas failed",
      },
      suggestion:
        "Verify that areas array contains only valid face area values.",
      action:
        "Check the areas array for invalid values and ensure user exists.",
    };

    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Complete onboarding - save all data at once
 * POST /api/onboarding/complete
 */
const completeOnboarding = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const {
      full_name,
      gender,
      age,
      weight,
      height,
      skin_type,
      has_botox,
      target_face_shape,
      makeup_frequency,
      skin_concerns,
      objectives,
      improvement_areas,
    } = req.body;

    // Log incoming data for debugging
    console.log("[Onboarding Complete] User ID:", userId);
    console.log("[Onboarding Complete] Data:", {
      full_name,
      gender,
      age,
      weight,
      height,
      skin_type,
      has_botox,
      target_face_shape,
      makeup_frequency,
      skin_concerns,
      objectives,
      improvement_areas,
    });

    // Automatically grant 24-hour free premium trial to all new users
    const premiumEndTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Update user's full name and premium status
    if (full_name) {
      await connection.execute(
        "UPDATE users SET full_name = ?, onboarding_completed = 1, is_premium = 1, premium_endtime = ? WHERE id = ?",
        [full_name, premiumEndTime, userId],
      );
    } else {
      await connection.execute(
        "UPDATE users SET onboarding_completed = 1, is_premium = 1, premium_endtime = ? WHERE id = ?",
        [premiumEndTime, userId],
      );
    }
    await connection.execute(
      'UPDATE users SET profile_picture_url = "/default.webp" WHERE id = ?',
      [userId],
    );
    // Insert or update profile
    const [existing] = await connection.execute(
      "SELECT id FROM user_profiles WHERE user_id = ?",
      [userId],
    );

    if (existing.length > 0) {
      await connection.execute(
        `UPDATE user_profiles 
         SET gender = ?, age = ?, weight = ?, height = ?, skin_type = ?, 
             has_botox = ?, target_face_shape = ?, makeup_frequency = ?
         WHERE user_id = ?`,
        [
          gender,
          age,
          weight,
          height,
          skin_type,
          has_botox ? 1 : 0,
          target_face_shape,
          makeup_frequency,
          userId,
        ],
      );
    } else {
      await connection.execute(
        `INSERT INTO user_profiles 
         (user_id, gender, age, weight, height, skin_type, has_botox, target_face_shape, makeup_frequency)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          gender,
          age,
          weight,
          height,
          skin_type,
          has_botox ? 1 : 0,
          target_face_shape,
          makeup_frequency,
        ],
      );
    }

    // Save skin concerns
    await connection.execute(
      "DELETE FROM user_skin_concerns WHERE user_id = ?",
      [userId],
    );
    if (skin_concerns && skin_concerns.length > 0) {
      const values = skin_concerns.map((concern) => [userId, concern]);
      const placeholders = values.map(() => "(?, ?)").join(", ");
      await connection.execute(
        `INSERT INTO user_skin_concerns (user_id, concern) VALUES ${placeholders}`,
        values.flat(),
      );
    }

    // Save objectives
    await connection.execute("DELETE FROM user_objectives WHERE user_id = ?", [
      userId,
    ]);
    if (objectives && objectives.length > 0) {
      const values = objectives.map((obj) => [userId, obj]);
      const placeholders = values.map(() => "(?, ?)").join(", ");
      await connection.execute(
        `INSERT INTO user_objectives (user_id, objective) VALUES ${placeholders}`,
        values.flat(),
      );
    }

    // Save improvement areas
    await connection.execute(
      "DELETE FROM user_improvement_areas WHERE user_id = ?",
      [userId],
    );
    if (improvement_areas && improvement_areas.length > 0) {
      const values = improvement_areas.map((area) => [userId, area]);
      const placeholders = values.map(() => "(?, ?)").join(", ");
      await connection.execute(
        `INSERT INTO user_improvement_areas (user_id, area) VALUES ${placeholders}`,
        values.flat(),
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Onboarding completed successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("[completeOnboarding] Error completing onboarding:", error);

    error.context = {
      operation: "completeOnboarding",
      reason:
        "Failed to complete onboarding process. Transaction was rolled back.",
      details: {
        userId: req.user?.id,
        receivedData: {
          hasFullName: !!req.body.full_name,
          hasGender: !!req.body.gender,
          hasAge: !!req.body.age,
          hasSkinConcerns: Array.isArray(req.body.skin_concerns),
          hasObjectives: Array.isArray(req.body.objectives),
          hasImprovementAreas: Array.isArray(req.body.improvement_areas),
        },
      },
      suggestion:
        "The complete onboarding requires all fields to be provided. One or more database operations failed.",
      action:
        "Verify all required fields are present and contain valid values according to the API documentation.",
    };

    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Get onboarding status
 * GET /api/onboarding/status
 */
const getOnboardingStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user
    const [users] = await pool.execute(
      "SELECT onboarding_completed FROM users WHERE id = ?",
      [userId],
    );

    // Get profile
    const [profiles] = await pool.execute(
      "SELECT * FROM user_profiles WHERE user_id = ?",
      [userId],
    );

    // Get skin concerns count
    const [concernsCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM user_skin_concerns WHERE user_id = ?",
      [userId],
    );

    // Get objectives count
    const [objectivesCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM user_objectives WHERE user_id = ?",
      [userId],
    );

    // Get improvement areas count
    const [areasCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM user_improvement_areas WHERE user_id = ?",
      [userId],
    );

    const profile = profiles[0] || {};

    res.json({
      success: true,
      data: {
        completed: !!users[0].onboarding_completed,
        steps: {
          basicInfo: !!(profile.gender && profile.age),
          physicalInfo: !!(profile.weight && profile.height),
          skinConcerns: concernsCount[0].count > 0,
          skinType: !!profile.skin_type,
          botoxHistory: profile.has_botox !== null,
          faceShape: !!profile.target_face_shape,
          makeupFrequency: !!profile.makeup_frequency,
          objectives: objectivesCount[0].count > 0,
          improvementAreas: areasCount[0].count > 0,
        },
      },
    });
  } catch (error) {
    console.error(
      "[getOnboardingStatus] Error fetching onboarding status:",
      error,
    );

    error.context = {
      operation: "getOnboardingStatus",
      reason: "Failed to retrieve onboarding status from database",
      details: {
        userId: req.user?.id,
      },
      suggestion:
        "Database query failed while checking onboarding completion status.",
      action: "Ensure user is authenticated and database is accessible.",
    };

    next(error);
  }
};

module.exports = {
  saveBasicInfo,
  savePhysicalInfo,
  saveSkinConcerns,
  saveSkinType,
  saveBotoxHistory,
  saveFaceShape,
  saveMakeupFrequency,
  saveObjectives,
  saveImprovementAreas,
  completeOnboarding,
  getOnboardingStatus,
};
