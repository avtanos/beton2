const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../storage');

const router = express.Router();
const RECIPES_FILE = 'recipes.json';

router.get('/', (req, res) => {
  const recipes = readJSON(RECIPES_FILE, []);
  res.json(recipes);
});

router.post('/', (req, res) => {
  const recipes = readJSON(RECIPES_FILE, []);
  const recipe = {
    id: uuidv4(),
    mark: req.body.mark,
    version: req.body.version || '1.0',
    cement: req.body.cement || 0,
    sand: req.body.sand || 0,
    gravel: req.body.gravel || 0,
    water: req.body.water || 0,
    additives: req.body.additives || [],
    createdAt: new Date().toISOString(),
    createdBy: req.body.createdBy || 'technologist',
  };
  recipes.push(recipe);
  writeJSON(RECIPES_FILE, recipes);
  res.status(201).json(recipe);
});

module.exports = router;
