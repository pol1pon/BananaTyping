import test from "node:test";
import assert from "node:assert/strict";
import {
  areCharsEqual,
  getKeyboardKeyForChar,
  isDashChar,
  isQuoteChar,
} from "./charMatching.ts";

test("areCharsEqual: распознаёт точные и регистронезависимые совпадения", () => {
  assert.equal(areCharsEqual("а", "а"), true);
  assert.equal(areCharsEqual("А", "а"), true);
  assert.equal(areCharsEqual("b", "B"), true);
  assert.equal(areCharsEqual("а", "б"), false);
  assert.equal(areCharsEqual("", "а"), false);
});

test("areCharsEqual: считает эквивалентными все виды тире, дефисов, кавычек, пробелов и е/ё", () => {
  assert.equal(isDashChar("—"), true);
  assert.equal(isDashChar("–"), true);
  assert.equal(areCharsEqual("-", "—"), true);
  assert.equal(areCharsEqual("-", "–"), true);
  assert.equal(areCharsEqual("-", "−"), true);

  assert.equal(isQuoteChar("«"), true);
  assert.equal(areCharsEqual('"', "«"), true);
  assert.equal(areCharsEqual('"', "»"), true);
  assert.equal(areCharsEqual('"', "“"), true);

  assert.equal(areCharsEqual(" ", "\u00A0"), true);
  assert.equal(areCharsEqual("е", "ё"), true);
  assert.equal(areCharsEqual("Ё", "Е"), true);
});

test("getKeyboardKeyForChar: нормализует спецсимволы к клавишам клавиатуры", () => {
  assert.equal(getKeyboardKeyForChar("—"), "-");
  assert.equal(getKeyboardKeyForChar("«"), '"');
  assert.equal(getKeyboardKeyForChar("f"), "F");
  assert.equal(getKeyboardKeyForChar(""), "");
});
