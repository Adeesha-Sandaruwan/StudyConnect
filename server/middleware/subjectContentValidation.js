import { body, validationResult } from "express-validator";

const isValidUrl = (value) => {
  if (value === undefined || value === null || value === "") return true;

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const pathTokens = (path) => {
  return String(path).match(/[^.[\]]+/g) || [];
};

const isNumericKey = (value) => /^\d+$/.test(value);

const setDeep = (target, path, value) => {
  const tokens = pathTokens(path);
  if (!tokens.length) return;

  let current = target;

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const last = i === tokens.length - 1;

    if (last) {
      if (Array.isArray(current)) {
        current[Number(token)] = value;
      } else {
        current[token] = value;
      }
      return;
    }

    const nextToken = tokens[i + 1];
    const shouldBeArray = isNumericKey(nextToken);

    if (Array.isArray(current)) {
      const index = Number(token);
      if (current[index] === undefined) {
        current[index] = shouldBeArray ? [] : {};
      }
      current = current[index];
    } else {
      if (current[token] === undefined) {
        current[token] = shouldBeArray ? [] : {};
      }
      current = current[token];
    }
  }
};

const toArray = (value) => {
  if (value === undefined || value === null || value === "") return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) return [];

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => String(item).trim())
            .filter(Boolean);
        }
      } catch {
        // fallback to comma split below
      }
    }

    if (trimmed.includes(",")) {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [trimmed];
  }

  return [String(value).trim()].filter(Boolean);
};

export const normalizeSubjectContentBody = (req, res, next) => {
  const original = req.body || {};
  const normalized = {};

  for (const [key, value] of Object.entries(original)) {
    if (key.includes(".") || key.includes("[")) {
      setDeep(normalized, key, value);
    } else {
      normalized[key] = value;
    }
  }

  if (typeof normalized.resources === "string") {
    try {
      normalized.resources = JSON.parse(normalized.resources);
    } catch {
      normalized.resources = {};
    }
  }

  if (
    normalized.resources !== undefined &&
    (!normalized.resources || typeof normalized.resources !== "object" || Array.isArray(normalized.resources))
  ) {
    normalized.resources = {};
  }

  if (Object.prototype.hasOwnProperty.call(normalized, "grade")) {
    normalized.grade = Number(normalized.grade);
  }

  if (Object.prototype.hasOwnProperty.call(normalized, "weekNumber")) {
    normalized.weekNumber = Number(normalized.weekNumber);
  }

  if (normalized.resources && Object.prototype.hasOwnProperty.call(normalized.resources, "referenceLinks")) {
    normalized.resources.referenceLinks = toArray(normalized.resources.referenceLinks);
  }

  if (normalized.resources && Object.prototype.hasOwnProperty.call(normalized.resources, "videoLinks")) {
    normalized.resources.videoLinks = toArray(normalized.resources.videoLinks);
  }

  req.body = normalized;
  next();
};

const runValidationResult = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  return next();
};

const baseContentValidators = [
  body("title")
    .optional({ nullable: true })
    .isString()
    .withMessage("Title must be a string")
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage("Title must be 1-120 characters"),
  body("subject")
    .optional({ nullable: true })
    .isString()
    .withMessage("Subject must be a string")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Subject is required"),
  body("grade")
    .optional({ nullable: true })
    .isInt({ min: 1, max: 13 })
    .withMessage("Grade must be between 1 and 13"),
  body("weekNumber")
    .optional({ nullable: true })
    .isInt({ min: 1, max: 52 })
    .withMessage("Week number must be 1-52"),
  body("lessonDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("lessonDate must be a valid date"),
  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 1500 })
    .withMessage("Description max length is 1500"),
  body("contentText")
    .optional({ nullable: true })
    .isString()
    .withMessage("contentText must be a string")
    .isLength({ max: 7000 })
    .withMessage("contentText max length is 7000"),
  body("homework")
    .optional({ nullable: true })
    .isString()
    .withMessage("Homework must be a string")
    .isLength({ max: 2000 })
    .withMessage("Homework max length is 2000"),
  body("status")
    .optional({ nullable: true })
    .isIn(["draft", "published"])
    .withMessage("Invalid status"),
  body("resources.quizFormLink")
    .optional({ nullable: true })
    .custom(isValidUrl)
    .withMessage("Invalid quizFormLink URL"),
  body("resources.worksheetLink")
    .optional({ nullable: true })
    .custom(isValidUrl)
    .withMessage("Invalid worksheetLink URL"),
  body("resources.answerSheetLink")
    .optional({ nullable: true })
    .custom(isValidUrl)
    .withMessage("Invalid answerSheetLink URL"),
  body("resources.meetingLink")
    .optional({ nullable: true })
    .custom(isValidUrl)
    .withMessage("Invalid meetingLink URL"),
  body("resources.referenceLinks")
    .optional({ nullable: true })
    .isArray()
    .withMessage("resources.referenceLinks must be an array"),
  body("resources.referenceLinks.*")
    .optional({ nullable: true })
    .custom(isValidUrl)
    .withMessage("Each reference link must be a valid URL"),
  body("resources.videoLinks")
    .optional({ nullable: true })
    .isArray()
    .withMessage("resources.videoLinks must be an array"),
  body("resources.videoLinks.*")
    .optional({ nullable: true })
    .custom(isValidUrl)
    .withMessage("Each video link must be a valid URL"),
];

export const validateSubjectContentCreate = [
  ...baseContentValidators,
  body("title").exists({ values: "falsy" }).withMessage("Title is required"),
  body("subject").exists({ values: "falsy" }).withMessage("Subject is required"),
  body("grade").exists({ values: "undefined" }).withMessage("Grade is required"),
  body("weekNumber").exists({ values: "undefined" }).withMessage("Week number is required"),
  body("lessonDate").exists({ values: "falsy" }).withMessage("lessonDate is required"),
  runValidationResult,
];

export const validateSubjectContentUpdate = [
  ...baseContentValidators,
  runValidationResult,
];
