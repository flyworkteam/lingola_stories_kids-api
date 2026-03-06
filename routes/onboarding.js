const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const {
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
  getOnboardingStatus
} = require('../controllers/onboardingController');

/**
 * @route   POST /api/onboarding/basic-info
 * @desc    Save basic information (name, gender, age)
 * @access  Private
 */
router.post(
  '/basic-info',
  authenticateToken,
  [
    body('full_name').optional().isString().trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
    body('gender').customSanitizer(value => value ? value.toLowerCase() : value).isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
    body('age').isInt({ min: 13, max: 120 }).withMessage('Age must be between 13 and 120')
  ],
  handleValidationErrors,
  saveBasicInfo
);

/**
 * @route   POST /api/onboarding/physical-info
 * @desc    Save physical information (weight, height)
 * @access  Private
 */
router.post(
  '/physical-info',
  authenticateToken,
  [
    body('weight').isInt({ min: 30, max: 300 }).withMessage('Weight must be between 30-300 kg'),
    body('height').isInt({ min: 100, max: 250 }).withMessage('Height must be between 100-250 cm')
  ],
  handleValidationErrors,
  savePhysicalInfo
);

/**
 * @route   POST /api/onboarding/skin-concerns
 * @desc    Save skin concerns (multiple selection)
 * @access  Private
 */
router.post(
  '/skin-concerns',
  authenticateToken,
  [
    body('concerns').isArray().withMessage('Concerns must be an array'),
    body('concerns.*').customSanitizer(value => value ? value.toLowerCase().replace(/ /g, '_') : value).isIn(['acne', 'redness', 'swelling', 'wrinkles', 'neck_lines']).withMessage('Invalid concern type')
  ],
  handleValidationErrors,
  saveSkinConcerns
);

/**
 * @route   POST /api/onboarding/skin-type
 * @desc    Save skin type
 * @access  Private
 */
router.post(
  '/skin-type',
  authenticateToken,
  [
    body('skin_type').customSanitizer(value => value ? value.toLowerCase() : value).isIn(['normal', 'oily', 'dry', 'combination', 'sensitive']).withMessage('Invalid skin type')
  ],
  handleValidationErrors,
  saveSkinType
);

/**
 * @route   POST /api/onboarding/botox
 * @desc    Save Botox history
 * @access  Private
 */
router.post(
  '/botox',
  authenticateToken,
  [
    body('has_botox').isBoolean().withMessage('has_botox must be a boolean')
  ],
  handleValidationErrors,
  saveBotoxHistory
);

/**
 * @route   POST /api/onboarding/face-shape
 * @desc    Save target face shape
 * @access  Private
 */
router.post(
  '/face-shape',
  authenticateToken,
  [
    body('target_face_shape').customSanitizer(value => value ? value.toLowerCase() : value).isIn(['heart', 'oval', 'square', 'round', 'diamond']).withMessage('Invalid face shape')
  ],
  handleValidationErrors,
  saveFaceShape
);

/**
 * @route   POST /api/onboarding/makeup-frequency
 * @desc    Save makeup frequency
 * @access  Private
 */
router.post(
  '/makeup-frequency',
  authenticateToken,
  [
    body('makeup_frequency').customSanitizer(value => value ? value.toLowerCase().replace(/ /g, '_') : value).isIn(['every_day', 'few_days_week', 'occasionally', 'never']).withMessage('Invalid makeup frequency')
  ],
  handleValidationErrors,
  saveMakeupFrequency
);

/**
 * @route   POST /api/onboarding/objectives
 * @desc    Save objectives (multiple selection)
 * @access  Private
 */
router.post(
  '/objectives',
  authenticateToken,
  [
    body('objectives').isArray().withMessage('Objectives must be an array'),
    body('objectives.*').customSanitizer(value => value ? value.toLowerCase().replace(/ /g, '_') : value).isIn(['reduce_wrinkles', 'tighten_skin', 'lift_eyelids', 'eliminate_double_chin', 'brighten_tone', 'all']).withMessage('Invalid objective')
  ],
  handleValidationErrors,
  saveObjectives
);

/**
 * @route   POST /api/onboarding/improvement-areas
 * @desc    Save improvement areas (multiple selection)
 * @access  Private
 */
router.post(
  '/improvement-areas',
  authenticateToken,
  [
    body('areas').isArray().withMessage('Areas must be an array'),
    body('areas.*').customSanitizer(value => value ? value.toLowerCase() : value).isIn(['forehead', 'eyes', 'nose', 'cheeks', 'lips', 'jawline', 'neck']).withMessage('Invalid area')
  ],
  handleValidationErrors,
  saveImprovementAreas
);

/**
 * @route   POST /api/onboarding/complete
 * @desc    Complete onboarding - save all data at once
 * @access  Private
 */
router.post(
  '/complete',
  authenticateToken,
  [
    body('full_name').optional().isString().trim(),
    body('gender').customSanitizer(value => value ? value.toLowerCase() : value).isIn(['male', 'female', 'other']),
    body('age').isInt({ min: 13, max: 120 }),
    body('weight').isInt({ min: 30, max: 300 }),
    body('height').isInt({ min: 100, max: 250 }),
    body('skin_type').customSanitizer(value => value ? value.toLowerCase() : value).isIn(['normal', 'oily', 'dry', 'combination', 'sensitive']),
    body('has_botox').isBoolean(),
    body('target_face_shape').customSanitizer(value => value ? value.toLowerCase() : value).isIn(['heart', 'oval', 'square', 'round', 'diamond']),
    body('makeup_frequency').customSanitizer(value => value ? value.toLowerCase().replace(/ /g, '_') : value).isIn(['every_day', 'few_days_week', 'occasionally', 'never']),
    body('skin_concerns').isArray(),
    body('skin_concerns.*').customSanitizer(value => value ? value.toLowerCase().replace(/ /g, '_') : value).isIn(['acne', 'redness', 'swelling', 'wrinkles', 'neck_lines']),
    body('objectives').isArray(),
    body('objectives.*').customSanitizer(value => value ? value.toLowerCase().replace(/ /g, '_') : value).isIn(['reduce_wrinkles', 'tighten_skin', 'lift_eyelids', 'eliminate_double_chin', 'brighten_tone', 'all']),
    body('improvement_areas').isArray(),
    body('improvement_areas.*').customSanitizer(value => value ? value.toLowerCase() : value).isIn(['forehead', 'eyes', 'nose', 'cheeks', 'lips', 'jawline', 'neck'])
  ],
  handleValidationErrors,
  completeOnboarding
);

/**
 * @route   GET /api/onboarding/status
 * @desc    Get onboarding status
 * @access  Private
 */
router.get(
  '/status',
  authenticateToken,
  getOnboardingStatus
);

module.exports = router;
