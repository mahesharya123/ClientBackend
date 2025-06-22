const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');

// Get all menus
router.get('/', async (req, res) => {
  try {
    const menus = await Menu.find();
    res.json(menus);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch menus' });
  }
});

// Add a new course with items
router.post('/', async (req, res) => {
  try {
    const menu = new Menu(req.body);
    await menu.save();
    res.status(201).json(menu);
  } catch (err) {
    res.status(400).json({ error: 'Failed to add menu' });
  }
});

// Update a course
router.put('/:id', async (req, res) => {
  try {
    const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update menu' });
  }
});

module.exports = router;
