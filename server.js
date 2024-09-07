const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const firebase = require("firebase/app");
require("firebase/auth");
require("firebase/database");
const session = require('express-session');
const bodyParser = require('body-parser');
const { getAuth , createUserWithEmailAndPassword , signInWithEmailAndPassword , onAuthStateChanged, signOut} = require("firebase/auth");
const { getFirestore } = require("firebase/firestore");
const { generateCertificate } = require('./createpdf.js'); 
const { uploadToPinata, storeHashOnBlockchain, verifyCertificateOnBlockchain } = require('./connection.js');
require('dotenv').config();

const crypto = require('crypto');


const secretKey = crypto.randomBytes(32).toString('hex');


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true
}));

app.use(express.urlencoded({ extended: true }));

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

const getUserState = (auth) => {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
            resolve(user);
        });
    });
};

app.use(async (req, res, next) => {
    try {
        const user = await getUserState(auth);
        req.session.user = user ? { uid: user.uid, email: user.email } : null;
    } catch (error) {
        console.error('Error getting auth state:', error);
    }
    next();
});

app.get('/', (req, res) => {
    const message = req.session.message || null;  // Get the message from the session
    req.session.message = null; 
    res.render('index.ejs', { user: req.session.user, message });
})



app.get('/login',(req, res) => {
    res.render('login.ejs',{ user: req.session.user});
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("logged in as : ", user.email);
        req.session.user = { uid: user.uid, email: user.email };
        res.redirect('/');
    } catch (error) {
        const errorMessage = error.message;
        console.error('login error:', errorMessage);
        res.render('login.ejs', { error: errorMessage , user: req.session.user });
    }
})

app.get('/signup',(req,res)=>{
  
    const error = req.query.error || null;
    res.render('signup.ejs',{ user: req.session.user,error});
   
})

app.post('/signup', async (req, res) => {
    const { email, password,confirmpassword } = req.body;
    if (password !== confirmpassword) {
        return res.render('signup.ejs', { error: 'Passwords do not match', user: req.session.user });
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('User created:', user.email);
        req.session.user = { uid: user.uid, email: user.email };
        res.redirect('/');
    }
    catch(error){
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('Signup error:', errorCode, errorMessage);
        return res.render('signup.ejs',{error:errorMessage,user:req.session.user})
        }
})


app.post('/logout', async (req, res) => {
    try {
        await signOut(auth);
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
                return res.redirect('/');
            }
            res.clearCookie('connect.sid');
            return res.redirect('/');
        });
    } catch (error) {
        console.error('Logout error:', error);
        return res.redirect('/');
    }
});

const instauth = (req, res, next) => {
    const instemail = process.env.instemail;
    const user = req.session.user;

    if (user && user.email === instemail) {
        next();
    } else {
        res.status(403).send('access restricted!(login as institute to proceed)');
    }
};

app.get('/dashboard',async (req,res)=>{
    res.render('dashboard.ejs',{user:req.session.user});
});

app.get('/issuenew',instauth,(req,res)=>{
    res.render('crtfrm.ejs',{user:req.session.user})
});

app.post('/issuenew',instauth,async(req,res)=>{
    const { name, USN, branch, sem,lvl,cours,dateofcmp } = req.body;
    const courseName = `${lvl} - ${cours}`;  
    const dateofcomp = dateofcmp;
    const instituteLogoPath = 'public/marvel.png';
    const certPath = path.join(__dirname, 'certs', `certificate-${name}.pdf`);
    
    function generateCertid(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    const certid = generateCertid(`${name}-${USN}`);
    
    try {
        await generateCertificate(certPath, USN, sem,branch, name, courseName, dateofcomp, instituteLogoPath);
        const ipfsHash = await uploadToPinata(certPath);
        console.log(`ipfshash : ${ipfsHash}\n certd : ${certid} `);
        
        // Store IPFS hash on blockchain
        await storeHashOnBlockchain(certid, ipfsHash);
        req.session.message = 'Certificate issued and stored on blockchain successfully!';
        res.redirect('/');

    } catch (error) {
        console.error('Certificate generation error:', error);
        res.status(500).send('Error generating certificate');
    }
});

app.get('/verify', (req, res) => {
    res.render('index.ejs', { user: req.session.user, result: null, error: null });
});

app.post('/verify', async (req, res) => {
    const { certId } = req.body;
    try {
        const certExists = await verifyCertificateOnBlockchain(certId); // Call the function to verify on blockchain
        if (certExists) {
            res.render('verify.ejs', { user: req.session.user, result: 'Certificate is valid!', error: null });
        } else {
            res.render('verify.ejs', { user: req.session.user, result: null, error: 'Certificate not found!' });
        }
    } catch (error) {
        console.error('Verification error:', error);
        res.render('index.ejs', { user: req.session.user, result: null, error: 'Error verifying certificate' });
    }
});


app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (!res.headersSent) {
        res.status(500).send('Something broke!');
    } else {
        next(err);
    }
});

app.listen(3000, () => {
    console.log("server running on 3000");
});