


import express from "express";
import path from "path";
import methodOverride from "method-override";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import expressLayouts from 'express-ejs-layouts';
import engine from 'ejs-mate';
dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();


const firebaseConfig = {
    apiKey: process.env.fbapiKey,
    authDomain: process.env.fbauthDomain,
    projectId: process.env.fbprojectId,
    storageBucket: process.env.fbstorageBucket,
    messagingSenderId: process.env.fbmessagingSenderId,
    appId: process.env.fbappId,
    measurementId: process.env.fbmeasurementIdfb
};
app.use(expressLayouts);

const authapp = initializeApp(firebaseConfig);
const auth = getAuth(authapp);


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.set('layout', 'layout/boilerplate');

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));
app.use(methodOverride("_method"));

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.post('/login', async (req, res) => {
    res.render('login.ejs');
});

app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    res.render('signup.ejs');
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        alert(`user created :${user}`);
    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode,errorMessage);
    }
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
