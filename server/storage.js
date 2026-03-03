/**
 * JSON-хранилище данных EIS
 * Все данные сохраняются в папку data/
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getPath(filename) {
  return path.join(DATA_DIR, filename);
}

function readJSON(filename, defaultValue = []) {
  const filePath = getPath(filename);
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

function writeJSON(filename, data) {
  const filePath = getPath(filename);
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function getById(collection, id) {
  return collection.find(item => item.id === id);
}

function upsert(collection, item) {
  const index = collection.findIndex(i => i.id === item.id);
  if (index >= 0) {
    collection[index] = { ...collection[index], ...item };
  } else {
    collection.push(item);
  }
  return collection;
}

function remove(collection, id) {
  return collection.filter(i => i.id !== id);
}

module.exports = {
  readJSON,
  writeJSON,
  getPath,
  getById,
  upsert,
  remove,
  DATA_DIR,
};
