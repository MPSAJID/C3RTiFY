const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const firebase = require("firebase/app");
require("firebase/auth");
require("firebase/database");
const session = require('express-session');
const bodyParser = require('body-parser');

require('dotenv').config();

const errorhandlingmw = require('./middlewares/errorhandlingmw');
const authRoutes = require('./routes/authroutes');
const certRoutes = require('./routes/certroutes');
const roleRoutes = require('./routes/roleroutes');

const crypto = require('crypto');


const secretKey = crypto.randomBytes(32).toString('hex');


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true
}));


const engine = require('ejs-mate');
app.engine("ejs", engine);

const firebaseConfig = {
    apiKey: process.env.fbapiKey,
    authDomain: process.env.fbauthDomain,
    projectId: process.env.fbprojectId,
    storageBucket: process.env.fbstorageBucket,
    messagingSenderId: process.env.fbmessagingSenderId,
    appId: process.env.fbappId,
    measurementId: process.env.fbmeasurementIdfb
};

const fbapp = firebase.initializeApp(firebaseConfig);

app.get('/', (req, res) => {
    const message = req.session.message || null;  // Get the message from the session
    req.session.message = null; 
    res.render('index.ejs', { user: req.session.user, message });
})



app.use('/auth', authRoutes);
app.use('/cert', certRoutes);
app.use('/roles', roleRoutes);

app.get('/login',(req, res) => {
    res.render('login.ejs',{ user: req.session.user});
})


app.get('/signup',(req,res)=>{
  
    const error = req.query.error || null;
    const role = req.query.role || '';
    res.render('signup.ejs',{ user: req.session.user,error,role});
   
})

app.get('/verify', (req, res) => {
    const certId = req.query.certId || '';
    res.render('verify.ejs', { user: req.session.user, certId : certId, result: null, error: null });
});

app.get('/issuenew',isInstitute,(req,res)=>{
    res.render('crtfrm.ejs',{user:req.session.user})
});

app.use(errorhandlingmw);
app.listen(3000, () => {
    console.log("server running on 3000");
});