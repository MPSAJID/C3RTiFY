const express = require('express');
const router = express.Router();
const app = express();
const path = require('path');
const methodOverride = require('method-override');
const session = require('express-session');
const bodyParser = require('body-parser');

require('dotenv').config();

const {sessioninfo,errmsg} = require('./middlewares/errorhandlingmw');
const authRoutes = require('./routes/authroutes.js');
const certRoutes = require('./routes/certroutes.js');
const roleRoutes = require('./routes/roleroutes.js');

const crypto = require('crypto');


const secretKey = crypto.randomBytes(32).toString('hex');


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));

app.use(express.static(path.join(__dirname, "../frontend/public")));
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


app.get('/', (req, res) => {
    const message = req.session.message || null;  // Get the message from the session
    req.session.message = null; 
    res.render('index.ejs', { user: req.session.user, message });
})


app.use( authRoutes);
app.use( certRoutes);
app.use( roleRoutes);

app.use(sessioninfo);
app.use(errmsg);



app.get('/', (req, res) => {
    const message = req.session.message || null;  // Get the message from the session
    req.session.message = null; 
    res.render('index.ejs', { user: req.session.user, message });
})


app.listen(3000, () => {
    console.log("server running on 3000");
});