const { getAuth , createUserWithEmailAndPassword , signInWithEmailAndPassword , onAuthStateChanged, signOut} = require("firebase/auth");
const { getFirestore, doc, setDoc, collection, query, where, getDocs, getDoc } = require("firebase/firestore");
const firebase = require("firebase/app");
const {firebaseConfig } = require('../firebaseconfig');
const fbapp = firebase.initializeApp(firebaseConfig);
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

const getauthstate = async (req, res, next) => {
    try {
        const user = await getUserState(auth);
        req.session.user = user ? user : null;
    } catch (error) {
        console.error('Error getting auth state:', error);
        req.session.user = null;
    }
    next();
}

module.exports = {getUserState, getauthstate};