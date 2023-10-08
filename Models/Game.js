const mongoose = require("mongoose");

const GamesSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  users: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  winner: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
});

module.exports = mongoose.model("Game", GamesSchema);
