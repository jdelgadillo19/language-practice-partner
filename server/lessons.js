import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LESSONS_DIR = path.join(__dirname, "..", "data", "lessons");

/** @type {Map<string, object>} */
const cache = new Map();

function loadLessonFile(fileName) {
  const filePath = path.join(LESSONS_DIR, fileName);
  const raw = fs.readFileSync(filePath, "utf8");
  const lesson = JSON.parse(raw);

  if (!lesson.unitId || !lesson.title || !lesson.targetLanguage) {
    throw new Error(`Invalid lesson file: ${fileName}`);
  }

  return lesson;
}

export function listLessons() {
  if (!fs.existsSync(LESSONS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(LESSONS_DIR).filter((f) => f.endsWith(".json"));
  return files.map((fileName) => {
    const lesson = getLessonById(path.basename(fileName, ".json"));
    return {
      unitId: lesson.unitId,
      title: lesson.title,
      targetLanguage: lesson.targetLanguage,
      cefrLevel: lesson.cefrLevel,
    };
  });
}

export function getLessonById(unitId) {
  if (cache.has(unitId)) {
    return cache.get(unitId);
  }

  const fileName = `${unitId}.json`;
  const filePath = path.join(LESSONS_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Lesson not found: ${unitId}`);
  }

  const lesson = loadLessonFile(fileName);
  cache.set(unitId, lesson);
  return lesson;
}
