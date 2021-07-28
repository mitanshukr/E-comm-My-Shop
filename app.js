const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');      //csrf Protection - useful for valid POST request.
const flash = require('connect-flash');     //flash the error messages while user for eg., logging in or signing up.
const multer = require('multer');   //file upload/download via user input.

const User = require('./models/user');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const errorControl = require('./controllers/errorControl');

const MONGODB_URI = "mongodb+srv://username:password@cluster0.i2j6g.mongodb.net/************?retryWrites=true&w=majority";

const app = express();
const csrfProtection = csrf();

app.set('view engine', 'ejs');  //Also available Pug
app.set('views', 'views');

const sessionStore = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions',
});

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-')+ '-' + file.originalname);       //file.filename //Date.now()
    }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.use(bodyParser.urlencoded({extended: false}));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
// app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(session({ secret: 'my secret', resave: false, saveUninitalized: false, store: sessionStore}));

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {   //added to all responses!
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    // throw new Error('Sync Dummy Error');     //this will work properly, and fall in special error middleware.
    if(!req.session.user){
        return next();
    }
    User.findById(req.session.user._id)
    .then(user => {
        // throw new Error('Async Dummy!');
        if(!user){
            return next();
        }
        req.user = user;
        next();
    }).catch(err => {
        // console.log(err);
        // throw new Error(err);    //In Async codes(then/catch), passing error like this will not fall in the special middleware, we defined in the below.
        next(new Error(err));       //Always pass errors using next(error); in the async codes.
    });
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorControl.get500);
app.use(errorControl.get404);

app.use((error, req, res, next) => {        //special kind of middleware, express exceutes this on next(error);
    // res.redirect('/500');
    res
      .status(500)
      .render("500", {
        pageTitle: "500 - Error!",
      });
});

mongoose.connect(
    MONGODB_URI,
    { useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => {
            console.log('Connected to Database Server...');
            app.listen(3000);
    }).catch(err => {
            console.log(err);
    });
