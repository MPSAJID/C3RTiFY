const { getFirestore, doc, setDoc, collection, query, where, getDocs, getDoc } = require("firebase/firestore");

const db=getFirestore();

const stddash = async (req, res) => {
    const { uid } = req.params;  
    if (req.session.user.uid !== uid) {
        return res.status(403).send('Access denied. You can only view your own dashboard.');
    }

    try {
        const studentDoc =  await getDoc(doc(db, 'students', uid));
        if (!studentDoc.exists) {
            return res.status(404).send('Student not found.');
        }

        const studentData = studentDoc.data();

        const q = query(collection(db, 'certificates'), where('usn', '==', studentData.usn));
        const certificatesSnapshot = await getDocs(q);

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
        console.log(error.stack)
        console.error('Error fetching student data:', error);
        res.status(500).send('Internal server error');
    }
};

const instdash = async (req,res)=>{
    
    const { uid } = req.params;  
    if (req.session.user.uid !== uid) {
        return res.status(403).send('Access denied. You can only view your own dashboard.');
    }

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
};

module.exports = {stddash, instdash };