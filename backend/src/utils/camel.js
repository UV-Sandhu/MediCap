function snakeToCamel(str) {
  return str.replace(/_([a-zA-Z0-9])/g, (_, letter) => letter.toUpperCase());
}

export function toCamel(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(toCamel);
  }

  const result = {};
  for (const [key, val] of Object.entries(value)) {
    const camelKey = snakeToCamel(key);
    result[camelKey] = toCamel(val);
  }
  return result;
}

export default toCamel;
