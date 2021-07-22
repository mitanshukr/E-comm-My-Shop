const express = require('express');
const { check, body } = require('express-validator');     //an express module to validate user inputs.

const router = express.Router();

const User = require('../models/user');
// const isAuth = require('../middleware/is-auth');    //check if the user is loggedin or not!
const authControl = require('../controllers/authControl');

router.get('/login', authControl.getLogin);
router.post(
  "/login",
  body("email").isEmail().withMessage("Please provide a valid Email."),
  authControl.postLogin
);
router.post('/logout', authControl.postLogout);

router.get('/signup', authControl.getSignup);
router.post(
  "/signup",
  [
    check("email") //body or check both are valid.
      .isEmail()
      .withMessage("Please provide a valid Email.")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject(
              "Email already Exist! Please try different one."
            );
          }
        });
      })
      .normalizeEmail(),    //removes extra spaces and change characters to all small, as like a good looking email ;)
    check(
      "password",
      "Password must be 5 char long and must contain at least 1 numeric value. No special characters!"
    )
      .isLength({ min: 5 })
      // .withMessage("Password must be 5 char long.")
      .matches(/\d/)
      // .withMessage("Password must contain a number")
      .isAlphanumeric()
      .trim(),
    check("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password Confirmation does not Match!");
      }
      return true;
    }),
  ],
  authControl.postSignup
);

router.get('/reset-password', authControl.getPasswordReset);
router.post('/reset-password', authControl.postPasswordReset);

router.get('/reset-password/:token', authControl.getPasswordResetLink);
router.post('/update-password', authControl.postUpdatePassword);

module.exports = router;