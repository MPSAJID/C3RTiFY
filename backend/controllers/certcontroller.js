const { uploadToPinata, storeHashOnBlockchain, verifyCertificateOnBlockchain, getCertificate, revokeCertificate } = require('../../blockchain/connection.js');
const { getFirestore, doc, setDoc, collection, query, where, getDocs, getDoc } = require("firebase/firestore");
const { generateCertificate } = require('./pdfcontroller.js'); 
const crypto = require('crypto');
const firebase = require("firebase/app");
const {firebaseConfig } = require('../firebaseconfig');
const fbapp = firebase.initializeApp(firebaseConfig);
const path=require("path")

const db = getFirestore(fbapp);

const verify = async (req, res) => {
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
};

const issuenew = async(req,res)=>{
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
        res.redirect(`/institute/dashboard/${req.session.user.uid}`);

    } catch (error) {
        console.error('Certificate generation error:', error);
        res.status(500).send('Error generating certificate,go back');
    }
};

const revoke = async (req, res) => {
    const certid = req.params.certid;
    try {
        await revokeCertificate(certid);
        const certRef = doc(db, "certificates", certid);
        await setDoc(certRef, { isRevoked: true }, { merge: true });
        
        console.log("---");
        req.session.message = 'Certificate revoked successfully';
        console.log("---");
        return res.redirect(`/institute/dashboard/${req.session.user.uid}`);
        console.log("---");
    } catch (error) {
        console.error('Error revoking certificate:', error);
        req.session.message = 'Error revoking certificate';
        return res.redirect(`/institute/dashboard/${req.session.user.uid}`);
    }
    console.log("---");
};

module.exports = {verify , issuenew, revoke};