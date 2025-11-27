/**
 * small helper utilities to coerce and sanitize user inputs
 */
const toInt = (v) => {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
};

const toPositiveInt = (v) => {
  const n = toInt(v);
  return n && n > 0 ? n : null;
};

const sanitizeString = (s, maxLen = 255) => {
  if (s === undefined || s === null) return "";
  const str = String(s).trim();
  return str.length > maxLen ? str.slice(0, maxLen) : str;
};

const filterNumericIds = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => {
      const n = Number(x);
      return Number.isInteger(n) && n > 0 ? n : null;
    })
    .filter(Boolean);
};

const placeholders = (arr) => (Array.isArray(arr) && arr.length ? arr.map(() => "?").join(",") : "");

module.exports = {
  toInt,
  toPositiveInt,
  sanitizeString,
  filterNumericIds,
  placeholders,
};