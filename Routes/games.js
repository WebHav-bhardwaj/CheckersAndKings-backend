const express = require("express");
const { createGamesRecord } = require("../Controllers/games");

const { protect } = require("../Middlewares/auth");

const router = express.Router();

router.post('/',createGamesRecord);


module.exports = router;
