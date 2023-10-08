const mongoose = require("mongoose");
const asyncHandler = require("../Middlewares/async");
const Game = require("../Models/Game");
const ErrorResponse = require("../Utils/errorResponse");

//@desc     Create a match record
//@route    POST/api/v1/games/
//@access   Public

exports.createGamesRecord = asyncHandler(async (req, res, next) => {
  const  {player1, player2, winner} = req.body

  const game = await Game.create({users:[player1, player2], winner})

  res.status(200).json({ success: true, data: game });
});


