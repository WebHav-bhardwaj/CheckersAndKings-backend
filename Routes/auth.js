const express = require("express");
const {
  updatePassword,
  updateDetails,
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  logout,
} = require("../Controllers/auth");

const { protect } = require("../Middlewares/auth");

const router = express.Router();


router.post("/login", login);
router.post("/register", register);
router.get("/logout", logout);
router.get("/me", protect, getMe);
router.put("/updatedetails", protect, updateDetails);
router.put("/updatepassword", protect, updatePassword);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);

module.exports = router;