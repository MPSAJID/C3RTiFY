const firebaseConfig = {
    apiKey: process.env.fbapiKey,
    authDomain: process.env.fbauthDomain,
    projectId: process.env.fbprojectId,
    storageBucket: process.env.fbstorageBucket,
    messagingSenderId: process.env.fbmessagingSenderId,
    appId: process.env.fbappId,
    measurementId: process.env.fbmeasurementIdfb
};
module.exports = {firebaseConfig};