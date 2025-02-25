require('dotenv').config();
const { getAuth , createUserWithEmailAndPassword , signInWithEmailAndPassword , onAuthStateChanged, signOut} = require("firebase/auth");
const { getFirestore, doc, setDoc, collection, query, where, getDocs, getDoc } = require("firebase/firestore");
const firebase = require("firebase/app");
const {firebaseConfig } = require('../firebaseconfig');
const fbapp = firebase.initializeApp(firebaseConfig);
const auth = getAuth(fbapp);
const db = getFirestore(fbapp);
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Fetch role from Firestore
        let userDoc = await getDoc(doc(db, 'students', user.uid));
        if (!userDoc.exists()) {
            // If not found in 'students', check 'institutes'
            userDoc = await getDoc(doc(db, 'institutes', user.uid));
        }
        
        // Check if the document exists in either collection
        let userData;
        if (userDoc.exists()) {
            userData = userDoc.data();
            req.session.user = {
                uid: user.uid,
                email: user.email,
                role: userData.role // Store role in session
            };
        } else {
            throw new Error('User not found');
        }
        

        console.log("Logged in as:", user.email, "Role:", userData.role);
        res.redirect(userData.role === 'student' ? `/student/dashboard/${user.uid}` : `/institute/dashboard/${user.uid}`);
    } catch (error) {
        console.error('Login error:', error.message);
        res.render('login.ejs', { error: error.message, user: req.session.user });
    }
};


const signup =  async (req, res) => {
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
        res.redirect(role === 'student' ? `/student/dashboard/${user.uid}` : `/institute/dashboard/${user.uid}`);
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
};

const logout = async (req, res) => {
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
};

module.exports = {signup, login, logout };