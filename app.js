const path = require('path');
const fs = require('fs');
const https = require('https')

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore= require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression =require('compression');
const morgan = require('morgan');

const errorController = require('./controllers/error');
const User = require('./models/user');
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.0yuodf5.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`


const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
})

const csrfProtection = csrf();



app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const { format } = require('path');

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' }
  );
  
  app.use(compression());
  app.use(morgan('combined', { stream: accessLogStream }));

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, 'images')
    },
    filename: (req, file, cb) =>{
        cb(null, new Date().toISOString() + '-' + file.originalname )
    }
})

const fileFilter =(req, file, cb) =>{
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
        cb(null, true);
    } else{
        cb(null, false);
    }
}


app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage: fileStorage, fileFilter: fileFilter }).single('image'))
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if(req.method === 'OPTIONS'){
        return res.sendStatus(200);
    }
    next();
})


app.use(session({secret: 'my secret',
        resave: false,
        saveUninitialized: false, 
        store:store }));

app.use(csrfProtection);
app.use(flash())

app.use((req, res, next)=>{
    if(!req.session.user){
        return next();
    }
    User.findById(req.session.user)
        .then(user =>{
            if(!user){
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err =>{
            throw new Error(err)
        })
});

app.use((req, res, next)=>{
    res.locals.isAuthenticated = req.session.loggedIn;
    res.locals.csrfToken = req.csrfToken();
    next()
})

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error,req,res,next)=>{
    console.log(error)
    res.redirect('/500')
})

mongoose.connect(MONGODB_URI)
    .then(result =>{
        app.listen(process.env.PORT || 3000 );
    })
    .catch(err => console.log(err));

