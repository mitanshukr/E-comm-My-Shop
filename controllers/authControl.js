const bcryptjs = require('bcryptjs');
const crypto = require('crypto');   //in-built express module/library to create secure, unique and random values(token). (we used in reset password.)
const User = require('../models/user');
const transport = require('../middleware/mailer-sendgrid'); //email-service
const { validationResult } = require('express-validator');

exports.getLogin = (req, res, next) => {
    // let message = req.flash('error');    [ ... ]
    // if(message.length > 0 ){
    //     message = message[0];
    // } else {
    //     message = null;
    // }
    res.render("auth/login", {
      pageTitle: "Login - Shop",
      isAuthenticated: false,
      errorMessage: req.flash('error'),     //this is an array with error message: [ 'something' ]
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).render("auth/login", {
            pageTitle: "Login - Shop",
            isAuthenticated: false,
            errorMessage: errors.array()[0].msg
          });
    }
    User.findOne({ email: email})
    .then(user => {
        if(!user){
            req.flash('error', 'Invalid Email address or Password.');
            return res.redirect('/login');
        }
        return bcryptjs.compare(password, user.password)
        .then(doMatch => {
            if(doMatch){
                req.session.user = user;
                req.session.isLoggedIn = true;
                return req.session.save(err => {    //save method is not needed actually, we are calling this to get assured that page must get redirected (**) only after successfully operating the above two lines.
                    res.redirect('/'); //*
                });
            } else {
                req.flash('error', 'Invalid Email address or Password.');
                return res.redirect('/login');
            }
        })
    }).catch(err => {
        console.log(err);
    });
    //res.setHeader('Set-Cookie', 'isLoggedIn=true'); //cookies only
    // res.redirect('/products');
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        // console.log(err);
        res.redirect('/');
    });
};

exports.getSignup = (req, res, next) => {
    res.render("auth/signup", {
      pageTitle: "Signup - MyShop",
      isAuthenticated: false,
      errorMessage: req.flash('error'),    //this is an array with error message: [ 'something' ]
      userInputs: { email: "", password: "", confirmPassword: "" },
    });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    // console.log(errors.array()[0].msg);
    if (!errors.isEmpty()) {
        return res.status(422).render("auth/signup", {
            pageTitle: "Signup - MyShop",
            isAuthenticated: false,
            errorMessage: errors.array()[0].msg,    //errors.array()[0] ? errors.array()[0].msg : null,
            userInputs: { email, password, confirmPassword },
        });
    }
    bcryptjs.hash(password, 12) //password encryption, non-reversable
    .then(hasedPassword => {
        const newUser = new User({
            email: email,
            password: hasedPassword,
            cart: { items: [] },
        });
        return newUser.save();
    }).then(result => {
        res.redirect('/login');
        return transport.sendMail({
            to: email,
            from: 'mitanshukr01@gmail.com',
            subject: 'Signup Successful!',
            html: '<h1>Welcome to My Shop</h1>'
        }).catch(err => {
            console.log(err);
        });
    }).catch(err => {
        console.log(err);
    });
};

exports.getPasswordReset = (req, res, next) => {
    res.render("auth/resetPassword", {
      pageTitle: "Reset Password",
      errorMessage: req.flash("error"),
    });
};

exports.postPasswordReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if(err){
            console.log(err);
            req.flash('error', 'Something went Wrong. Please try again!');
            return res.redirect('/reset-password');
        }
        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email})
        .then(user => {
            if(!user){
                req.flash('error', 'User does not exist!');
                return res.redirect('/reset-password');
            }
            user.resetToken = token;
            user.resetTokenExpiry = Date.now() + 3600000;
            return user.save();
        }).then(result => {
            req.flash('error', 'Please check your inbox!');
            res.redirect('/reset-password');
            return transport.sendMail({
                to: req.body.email,
                from: 'mitanshukr01@gmail.com',
                subject: 'Password Reset',
                html: `<h3>You requested for Password Reset</h3>
                        <p>Please click on the <a href="http://localhost:3000/reset-password/${token}">link</a> to reset your password.</p>
                        <small>The link is valid for an hour.</small>`,
            });
        }).catch(err => {
            console.log(err);
        });
    });
};

exports.getPasswordResetLink = (req, res, next) => {
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiry: {$gt: Date.now()} })
    .then(user => {
        if(!user){
            req.flash('error', 'Link is expired or invalid!');
            return res.redirect('/login');
        }
        res.render('auth/updatePassword', {
            pageTitle: 'Update Password',
            errorMessage: req.flash('error'),
            userId: user._id.toString(),
            passwordToken: token,
        });
    }).catch(err => {
        console.log(err);
        req.flash('error', 'Something went Wrong!');
        res.redirect('/login');
    });
};

exports.postUpdatePassword = (req, res, next) => {
    const passwordToken = req.body.passwordToken;
    const userId = req.body.userId;
    const newPassword = req.body.newPassword;
    let resetUser;

    User.findOne({ _id: userId, resetToken: passwordToken, resetTokenExpiry: {$gt: Date.now()} })
    .then(user => {
        // if(!user){
        //     req.flash('error', 'something went wrong!');
        //     return res.redirect('/login');
        // }
        resetUser = user;
        return bcryptjs.hash(newPassword, 12);
    })
    .then(hashedpassword => {
        resetUser.password = hashedpassword;
        resetUser.resetToken = undefined;       //we should better use //delete resetUser.resetToken;
        resetUser.resetTokenExpiry = undefined;
        return resetUser.save();
    })
    .then(result => {
        req.flash('error', 'Password Reset Successful!');   //success
        res.redirect('/login');
    }).catch(err => {
        console.log(err);
        req.flash('error', 'something went wrong!');
        res.redirect('/login');
    });
};