/**
 * Утилиты для проверки и сопоставления символов при скоропечатании
 */

// Все варианты тире, дефисов и знаков минус в Unicode
export const DASH_CHARS = new Set([
  "-", // U+002D Обычный дефис/минус на клавиатуре
  "—", // U+2014 Длинное тире (Em dash)
  "–", // U+2013 Среднее тире (En dash)
  "−", // U+2212 Математический минус
  "‑", // U+2011 Неразрывный дефис
  "‐", // U+2010 Дефис
]);

// Все варианты кавычек
export const QUOTE_CHARS = new Set([
  '"',
  "«",
  "»",
  "“",
  "”",
  "„",
  "‟",
]);

/**
 * Проверяет, является ли символ любым видом тире или дефиса
 */
export function isDashChar(char: string): boolean {
  return DASH_CHARS.has(char);
}

/**
 * Проверяет, является ли символ любым видом кавычки
 */
export function isQuoteChar(char: string): boolean {
  return QUOTE_CHARS.has(char);
}

/**
 * Сравнивает нажатую клавишу с ожидаемым символом в тексте с учетом
 * эквивалентности тире/дефисов, кавычек и пробелов
 */
export function areCharsEqual(typedKey: string, expectedChar: string): boolean {
  if (!typedKey || !expectedChar) return false;

  // Прямое совпадение без учета регистра
  if (typedKey.toLowerCase() === expectedChar.toLowerCase()) {
    return true;
  }

  // Отслеживание тире/дефиса: если в тексте длинное тире '—', среднее '–' или дефис '-',
  // а пользователь нажимает обычный дефис '-' — считаем ввод абсолютно верным!
  if (isDashChar(typedKey) && isDashChar(expectedChar)) {
    return true;
  }

  // Эквивалентность кавычек (« » “ ” ")
  if (isQuoteChar(typedKey) && isQuoteChar(expectedChar)) {
    return true;
  }

  // Неразрывный пробел (U+00A0) и обычный пробел
  if ((typedKey === " " || typedKey === "\u00A0") && (expectedChar === " " || expectedChar === "\u00A0")) {
    return true;
  }

  // Буква 'ё' и 'е' (опционально для удобства русского ввода)
  if ((typedKey.toLowerCase() === "е" || typedKey.toLowerCase() === "ё") &&
      (expectedChar.toLowerCase() === "е" || expectedChar.toLowerCase() === "ё")) {
    return true;
  }

  return false;
}

/**
 * Приводит ожидаемый символ к клавише на виртуальной клавиатуре
 */
export function getKeyboardKeyForChar(char: string): string {
  if (!char) return "";
  if (isDashChar(char)) return "-";
  if (isQuoteChar(char)) return '"';
  return char.toUpperCase();
}
