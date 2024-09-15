const express = require('express');
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const firebase = require("firebase/app");
const admin = require('firebase-admin');
require("firebase/auth");
require("firebase/database");
const session = require('express-session');
const bodyParser = require('body-parser');
const { getAuth , createUserWithEmailAndPassword , signInWithEmailAndPassword , onAuthStateChanged, signOut} = require("firebase/auth");
const { getFirestore, doc, setDoc, collection, getDocs,getDoc } = require("firebase/firestore");
const { generateCertificate } = require('./createpdf.js'); 
const { uploadToPinata, storeHashOnBlockchain, verifyCertificateOnBlockchain, getcertificates, revokeCertificate } = require('./connection.js');
require('dotenv').config();

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
const { cert } = require('firebase-admin/app');
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
// admin.initializeApp({
//     credential: admin.credential.applicationDefault(),
//   });
const auth = getAuth(fbapp);
const db = getFirestore(fbapp);

const getUserState = async (auth) => {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Define references for both students and institutes
                    const studentDocRef = doc(db, 'students', user.uid);
                    const instituteDocRef = doc(db, 'institutes', user.uid);

                    // Fetch documents
                    const [studentDoc, instituteDoc] = await Promise.all([
                        getDoc(studentDocRef),
                        getDoc(instituteDocRef)
                    ]);

                    let userData = null;

                    // Check which document exists and set userData
                    if (studentDoc.exists()) {
                        userData = studentDoc.data();
                    } else if (instituteDoc.exists()) {
                        userData = instituteDoc.data();
                    }

                    // Resolve with user data including role
                    resolve({
                        uid: user.uid,
                        email: user.email,
                        role: userData ? userData.role : null
                    });

                } catch (error) {
                    console.error('Error fetching user data:', error);
                    resolve({
                        uid: user.uid,
                        email: user.email,
                        role: null
                    });
                }
            } else {
                resolve(null);
            }
        });
    });
};


app.use(async (req, res, next) => {
    try {
        const user = await getUserState(auth);
        req.session.user = user ? user : null;
    } catch (error) {
        console.error('Error getting auth state:', error);
        req.session.user = null;
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
        
        // Fetch role from Firestore
        let userDoc = await getDoc(doc(db, 'students', user.uid)) || await getDoc(doc(db, 'institutes', user.uid));
        
        if (!userDoc.exists()) {
            throw new Error('User not found');
        }

        const userData = userDoc.data();
        req.session.user = {
            uid: user.uid,
            email: user.email,
            role: userData.role // Store role in session
        };

        console.log("Logged in as:", user.email, "Role:", userData.role);
        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error.message);
        res.render('login.ejs', { error: error.message, user: req.session.user });
    }
});

app.get('/test', (req, res) => {
    res.send(req.session.user); // Check what’s in the session
});


app.use((req, res, next) => {
    console.log('Session user:', req.session.user); // Log session user info
    next();
});

app.get('/signup',(req,res)=>{
  
    const error = req.query.error || null;
    const role = req.query.role || '';
    res.render('signup.ejs',{ user: req.session.user,error,role});
   
})

app.post('/signup', async (req, res) => {
    const { name, usn, sem, branch, email, password, confirmpassword, role } = req.body;

    // Check if passwords match
    if (password !== confirmpassword) {
        return res.render('signup.ejs', {
            error: 'Passwords do not match',
            user: req.session.user,
            name,
            email,
            usn,
            sem,
            branch,
            role
        });
    }

    try {
        // Create the user using Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save user data to Firestore based on role
        if (role === 'student') {
            await setDoc(doc(db, "students", user.uid), {
                name,
                usn,
                sem,
                branch,
                email,
                role: 'student'
            });
        } else if (role === 'institute') {
            await setDoc(doc(db, "institutes", user.uid), {
                name,
                email,
                role: 'institute'
            });
        }

        // Set session user data
        req.session.user = { uid: user.uid, email: user.email, role };

        // Redirect based on role
        res.redirect(role === 'student' ? `/student/dashboard/${user.uid}` : '/dashboard');
    } catch (error) {
        console.error('Signup error:', error.message);

        return res.render('signup.ejs', {
            error: error.message,
            user: req.session.user,
            name,
            email,
            usn,
            sem,
            branch,
            role
        });
    }
});




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

app.get('/verify', (req, res) => {
    const certId = req.query.certId || '';
    res.render('verify.ejs', { user: req.session.user, certId : certId, result: null, error: null });
});

app.post('/verify', async (req, res) => {
    const { certId } = req.body;
    try {
        const certExists = await verifyCertificateOnBlockchain(certId); // Call the function to verify on blockchain
        if (certExists) {
            res.render('verify.ejs', { user: req.session.user,certId, result: 'Certificate is valid!', error: null });
        } else {
            res.render('verify.ejs', { user: req.session.user,certId, result: null, error: 'Certificate has been revoked or not found!' });        }
    } catch (error) {
        console.error('Verification error:', error);
        res.render('verify.ejs', { user: req.session.user, certId,result: null, error: 'serverError verifying certificate' });
    }
});


const isStudent = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'student') {
        next(); // User is a student, proceed
    } else {
        res.status(403).send('Access denied.'); // Access denied for non-students
    }
};
const isInstitute = (req, res, next) => {
    
    if (!req.session.user ) {
        return res.redirect('/login');
    }
    if (req.session.user && req.session.user.role === 'institute') {
        next(); 
    } else {
        res.status(403).send('Access denied.'); 
    }
};



app.get('/issuenew',isInstitute,(req,res)=>{
    res.render('crtfrm.ejs',{user:req.session.user})
});

app.post('/issuenew',isInstitute,async(req,res)=>{
    const { name, USN, branch, sem,lvl,cours,dateofcmp } = req.body;
    const courseName = `${req.body.lvl} - ${req.body.cours}`;  
    const dateofcomp = dateofcmp;
    const instituteLogoPath = 'public/marvel.png';
    const certPath = path.join(__dirname, 'certs', `cert-${name}-${USN}.pdf`);
    
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

        await setDoc(doc(db, "certificates", certid), {
            certId: certid,
            name: name,
            usn: USN,
            sem: sem,
            branch: branch,
            course: courseName,
            ipfshash: ipfsHash
        });
        req.session.message = 'Certificate issued and stored on blockchain successfully!';
        res.redirect('/dashboard');

    } catch (error) {
        console.error('Certificate generation error:', error);
        res.status(500).send('Error generating certificate');
    }
});

app.post('/revoke/:certid',isInstitute, async (req, res) => {
    
    const certid = req.params.certid;
    try {
         await revokeCertificate(certid);
        const certRef = doc(db, "certificates", certid);
        await setDoc(certRef, { isRevoked: true }, { merge: true });
    
        req.session.message = 'Certificate revoked successfully';
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error revoking certificate:', error);
        req.session.message = 'Error revoking certificate';
        res.redirect('/dashboard');
    }
});



app.get('/dashboard',isInstitute,async (req,res)=>{
    if (!req.session.user ) {
        return res.redirect('/login');
    }
        try {
            const querySnapshot = await getDocs(collection(db, "certificates"));
            const certificates = [];

            querySnapshot.forEach((doc) => {
                certificates.push(doc.data());
            });

            const message = req.session.message || null;  
            req.session.message = null; 

            res.render('dashboard.ejs', {
                user: req.session.user,
                certificates: certificates,
                message: message
            });
    } catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).send('Error fetching certificates');
    }
});

app.get('/student/dashboard/:uid', isStudent, async (req, res) => {
    const { uid } = req.params;  
    if (req.session.user.uid !== uid) {
        return res.status(403).send('Access denied. You can only view your own dashboard.');
    }

    try {
        const studentDoc = await firebase.firestore().collection('students').doc(uid).get();
        if (!studentDoc.exists) {
            return res.status(404).send('Student not found.');
        }

        const studentData = studentDoc.data();

        const certificatesSnapshot = await firebase.firestore().collection('certificates')
            .where('usn', '==', studentData.usn).get();

        const certificates = [];
        certificatesSnapshot.forEach(doc => {
            certificates.push(doc.data());
        });

        res.render('stddash.ejs', {
            user: req.session.user,
            student: studentData,
            certificates
        });

    } catch (error) {
        console.error('Error fetching student data:', error);
        res.status(500).send('Internal server error');
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