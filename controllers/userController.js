const { pool } = require("../config/database");
const { uploadBuffer } = require("../utils/bunny");
const path = require("path");
const sharp = require("sharp");

/**
 * Get user profile
 * GET /api/user/profile
 */
const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user with profile
    const [users] = await pool.execute(
      `SELECT * FROM users WHERE id = ?`,
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userData = users[0];

    // Get preferred categories
    const [categories] = await pool.execute(
      "SELECT category_name FROM user_preferred_categories WHERE user_id = ?",
      [userId],
    );

    // Get week activity (Sun-Sat)
    const [weekActivityData] = await pool.execute(
      `SELECT DAYOFWEEK(activity_date) as day_index 
       FROM user_activity_logs 
       WHERE user_id = ? 
         AND YEARWEEK(activity_date, 0) = YEARWEEK(CURRENT_DATE(), 0)`,
      [userId]
    );

    // MySQL DAYOFWEEK: 1=Sun, 2=Mon... 7=Sat
    const weekActivity = [false, false, false, false, false, false, false];
    for (const record of weekActivityData) {
      weekActivity[record.day_index - 1] = true;
    }

    // Calculate current streak
    const [recentDates] = await pool.execute(
      `SELECT activity_date 
       FROM user_activity_logs 
       WHERE user_id = ? 
       ORDER BY activity_date DESC LIMIT 365`,
      [userId]
    );

    let currentStreak = 0;
    if (recentDates.length > 0) {
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      let expectedDate = today;

      let firstDate = new Date(recentDates[0].activity_date);
      firstDate.setHours(0, 0, 0, 0);

      if (firstDate.getTime() === expectedDate.getTime()) {
        currentStreak = 1;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        expectedDate.setDate(expectedDate.getDate() - 1); // Yesterday
        if (firstDate.getTime() === expectedDate.getTime()) {
          currentStreak = 1;
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
          currentStreak = 0;
        }
      }

      if (currentStreak > 0) {
        for (let i = 1; i < recentDates.length; i++) {
          let d = new Date(recentDates[i].activity_date);
          d.setHours(0, 0, 0, 0);
          if (d.getTime() === expectedDate.getTime()) {
            currentStreak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          fullName: userData.full_name,
          authProvider: userData.auth_provider,
          isGuest: !!userData.is_guest,
          isPremium: !!userData.is_premium,
          onboardingCompleted: !!userData.onboarding_completed,
          preferredLanguage: userData.preferred_language || "en",
          profilePictureUrl: userData.profile_picture_url,
          invitationCode: userData.invitation_code,
          onboardingCompleted: userData.onboarding_completed,
          lastLoginAt: userData.last_login_at,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at,
          age: userData.age,
        },
        profile: {
          preferredCategories: categories.map((c) => c.category_name),
        },
        streak: {
          currentStreak,
          weekActivity
        }
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/user/profile
 */
const updateUserProfile = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const {
      full_name,
      age,
      preferred_language,
      profile_picture_url,
    } = req.body;

    // Prepare arrays for updating users table
    const userUpdates = [];
    const userValues = [];

    if (full_name !== undefined) {
      userUpdates.push("full_name = ?");
      userValues.push(full_name);
    }
    if (preferred_language !== undefined) {
      userUpdates.push("preferred_language = ?");
      userValues.push(preferred_language);
    }
    if (age !== undefined) {
      userUpdates.push("age = ?");
      userValues.push(age);
    }
    if (profile_picture_url !== undefined) {
      userUpdates.push("profile_picture_url = ?");
      userValues.push(profile_picture_url);
    }

    if (userUpdates.length > 0) {
      userValues.push(userId);
      await connection.execute(
        `UPDATE users SET ${userUpdates.join(", ")} WHERE id = ?`,
        userValues,
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Save OneSignal player ID
 * POST /api/user/onesignal
 */
const saveOneSignalPlayerId = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { player_id } = req.body;

    if (!player_id) {
      return res.status(400).json({
        success: false,
        message: "OneSignal player ID is required",
      });
    }

    await pool.execute(
      "UPDATE users SET onesignal_player_id = ? WHERE id = ?",
      [player_id, userId],
    );

    res.json({
      success: true,
      message: "OneSignal player ID saved successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload profile photo
 * POST /api/user/profile/photo
 */
const uploadProfilePhoto = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const file = req.file;

    // Compression + conversion settings
    const TARGET_BYTES = 200 * 1024; // ~200KB target size
    const MAX_WIDTH = 1024;
    const qualitySteps = [80, 70, 60, 50, 40, 30];
    let optimizedBuffer = null;

    for (const q of qualitySteps) {
      optimizedBuffer = await sharp(file.buffer)
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: q, effort: 6 })
        .toBuffer();

      if (optimizedBuffer.length <= TARGET_BYTES) break;
    }

    const filePath = `/${userId}_${Date.now()}.webp`;
    const destPath = `user${filePath}`;

    const publicUrl = await uploadBuffer(
      optimizedBuffer,
      destPath,
      "image/webp",
    );

    // Save CDN URL to user
    await pool.execute(
      "UPDATE users SET profile_picture_url = ? WHERE id = ?",
      [filePath, userId],
    );

    res.json({
      success: true,
      profilePictureUrl: publicUrl,
      message: "Profile photo uploaded successfully",
    });
  } catch (error) {
    next(error);
  }
};



/**
 * Save user onboarding preferences
 * POST /api/user/preferences
 */
const savePreferences = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;
    const { preferred_language, preferred_categories } = req.body;

    if (preferred_language) {
      await connection.execute(
        `UPDATE users SET preferred_language = ?, onboarding_completed = 1 WHERE id = ?`,
        [preferred_language, userId]
      );
    } else {
      await connection.execute(
        `UPDATE users SET onboarding_completed = 1 WHERE id = ?`,
        [userId]
      );
    }

    if (preferred_categories && Array.isArray(preferred_categories)) {
      await connection.execute(
        `DELETE FROM user_preferred_categories WHERE user_id = ?`,
        [userId]
      );

      if (preferred_categories.length > 0) {
        const values = [];
        const placeholders = [];
        for (const cat of preferred_categories) {
          values.push(userId, cat);
          placeholders.push("(?, ?)");
        }

        await connection.execute(
          `INSERT IGNORE INTO user_preferred_categories (user_id, category_name) VALUES ${placeholders.join(",")}`,
          values
        );
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Preferences saved successfully",
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Delete user account
 * DELETE /api/user/account
 */
const deleteAccount = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const userId = req.user.id;

    await connection.execute("DELETE FROM users WHERE id = ?", [userId]);

    await connection.commit();

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

/**
 * Log user daily activity
 * POST /api/user/activity
 */
const logUserActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await pool.execute(
      `INSERT IGNORE INTO user_activity_logs (user_id, activity_date) VALUES (?, CURRENT_DATE())`,
      [userId]
    );

    res.json({
      success: true,
      message: "Activity logged successfully"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  saveOneSignalPlayerId,
  deleteAccount,
  uploadProfilePhoto,
  savePreferences,
  logUserActivity,
};
