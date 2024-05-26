const admin = require('firebase-admin');

const serviceAccount = require('./Serviceaccountkey.json'); // Update with the path to your service account key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://crunchquest-default-rtdb.firebaseio.com/' // Update with your database URL
});

const db = admin.database();

module.exports = db;
