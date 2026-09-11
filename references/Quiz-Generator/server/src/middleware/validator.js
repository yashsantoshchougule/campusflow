import { body, param, validationResult } from "express-validator";

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const quizParamsValidator = [
  body("documentId").isMongoId().withMessage("Invalid document ID"),
  body("params.count")
    .optional()
    .isInt({ min: 5, max: 50 })
    .withMessage("Count must be 5-50"),
  body("params.language")
    .optional()
    .isIn(["zh", "en"])
    .withMessage("Language must be zh or en"),
  body("params.difficulty.easy")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Easy difficulty must be >= 0"),
  body("params.difficulty.medium")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Medium difficulty must be >= 0"),
  body("params.difficulty.hard")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Hard difficulty must be >= 0"),
  validate,
];

export const submitAnswersValidator = [
  body("answers").isArray().withMessage("Answers must be an array"),
  body("answers.*")
    .isInt({ min: 0, max: 3 })
    .withMessage("Each answer must be 0-3"),
  validate,
];
