const mongoose = require('mongoose');

const DishSchema = new mongoose.Schema({
  name: String,
  price: String
});

const MenuSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Hot Drinks"
  items: [DishSchema]
});

module.exports = mongoose.model('Menu', MenuSchema);
