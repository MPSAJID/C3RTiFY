const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const firebase = require("firebase/app");
require("firebase/auth");
require("firebase/database");
const session = require('express-session');
const bodyParser = require('body-parser');
const { getAuth , createUserWithEmailAndPassword , signInWithEmailAndPassword , onAuthStateChanged} = require("firebase/auth");
const { getFirestore } = require("firebase/firestore");

require('dotenv').config();

const crypto = require('crypto');


const secretKey = crypto.randomBytes(32).toString('hex');


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")))
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
const auth = getAuth(fbapp);

app.use((req, res, next) => {
    onAuthStateChanged(auth, (user) => {
        var uid = user.uid;
        req.session.user = user; // Store user in session
        next(); // Pass control to the next middleware or route handler
    });
});

app.get('/', (req, res) => {
    res.render('index.ejs',{ user: req.session.user });
})



app.get('/login', async (req, res) => {
    res.render('login.ejs');
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("logged in as : ", user);
        req.session.user = user;
        res.redirect('/');
    } catch (error) {
        const errorMessage = error.message;
        console.error('login error:', errorMessage);
        res.render('login.ejs', { error: errorMessage });
    }
})

app.get('/signup',(req,res)=>{
    res.render('signup.ejs');
})

app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Signed up successfully
        const user = userCredential.user;
        console.log('User created:', user);
        req.session.user = user;
        res.send('User created successfully');
    }
    catch(error){
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('Signup error:', errorCode, errorMessage);
        res.status(500).send('Signup failed: ' + errorMessage);
        }
})

app.listen(3000, () => {
    console.log("server running on 3000");
});